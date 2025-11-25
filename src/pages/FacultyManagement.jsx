import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Edit, Trash2, Search, Building2, Users, CheckCircle2, Calendar, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { facultyAPI, majorAPI, userAPI, departmentAPI } from '@/services/api'

const defaultFormState = {
  faculty_code: '',
  faculty_name: '',
  description: '',
  established_date: '',
  dean_id: '',
  contact_email: '',
  contact_phone: '',
  department_id: '',
  major_ids: [],
  is_active: true
}

const FacultyManagement = ({
  embedded = false,
  showHeader = !embedded,
  showStats = !embedded,
  showSearch = true,
  searchTermOverride,
  onStatsChange
}) => {
  const [faculties, setFaculties] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [majors, setMajors] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [formData, setFormData] = useState(defaultFormState)
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false)
  const [departmentSearch, setDepartmentSearch] = useState('')
  const departmentDropdownRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [facultyRes, lecturerRes, majorRes, deptRes] = await Promise.all([
        facultyAPI.getAll(),
        userAPI.getAllByRole('lecturer'),
        majorAPI.getAll(),
        departmentAPI.getAll()
      ])
      setFaculties(facultyRes.data || [])
      setLecturers(
        (lecturerRes.data || []).map((lecturer) => ({
          id: lecturer.id,
          name: lecturer.full_name || `${lecturer.first_name || ''} ${lecturer.last_name || ''}`.trim(),
          email: lecturer.email
        }))
      )
      setMajors(majorRes.data || [])
      setDepartments(deptRes.data || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const effectiveSearchTerm = searchTermOverride !== undefined ? searchTermOverride : searchTerm

  const filteredFaculties = useMemo(() => {
    const keyword = (effectiveSearchTerm || '').trim().toLowerCase()
    if (!keyword) return faculties
    return faculties.filter((faculty) =>
      faculty.faculty_name?.toLowerCase().includes(keyword) ||
      faculty.faculty_code?.toLowerCase().includes(keyword) ||
      faculty.dean_name?.toLowerCase().includes(keyword)
    )
  }, [faculties, effectiveSearchTerm])

  const stats = useMemo(() => ({
    total: faculties.length,
    active: faculties.filter(f => f.is_active).length,
    inactive: faculties.filter(f => !f.is_active).length,
    withDean: faculties.filter(f => f.dean_id).length
  }), [faculties])

  useEffect(() => {
    if (typeof onStatsChange === 'function') {
      onStatsChange(stats)
    }
  }, [stats, onStatsChange])

  const lecturerOptions = useMemo(
    () => [...lecturers].sort((a, b) => a.name.localeCompare(b.name)),
    [lecturers]
  )

  const selectedMajorNames = useMemo(() => {
    if (!formData.major_ids?.length) return []
    const lookup = majors.reduce((acc, major) => {
      acc[major.id] = major.major_name
      return acc
    }, {})
    return formData.major_ids.map((id) => lookup[id]).filter(Boolean)
  }, [formData.major_ids, majors])

  const filteredMajorsForDropdown = useMemo(() => {
    const keyword = departmentSearch.trim().toLowerCase()
    if (!keyword) return majors
    return majors.filter((major) => major.major_name.toLowerCase().includes(keyword))
  }, [majors, departmentSearch])

  const hasFacultyRelations = (faculty) => {
    const hasMajors = Array.isArray(faculty.major_ids) && faculty.major_ids.length > 0
    const hasDepartments = (Array.isArray(faculty.department_list) && faculty.department_list.length > 0) || Boolean(faculty.department_id)
    const hasDean = Boolean(faculty.dean_id)
    return hasMajors || hasDepartments || hasDean
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (departmentDropdownRef.current && !departmentDropdownRef.current.contains(event.target)) {
        setDepartmentDropdownOpen(false)
      }
    }
    if (departmentDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [departmentDropdownOpen])

  const handleCreate = () => {
    setModalType('create')
    setSelectedFaculty(null)
    setFormData(defaultFormState)
    setShowModal(true)
  }

  const handleEdit = (faculty) => {
    setModalType('edit')
    setSelectedFaculty(faculty)
    // Xử lý department_id: ưu tiên department_id trực tiếp, sau đó Department?.id, cuối cùng là empty string
    // Debug: log để kiểm tra
    console.log('Edit faculty:', {
      department_id: faculty.department_id,
      Department: faculty.Department,
      fullFaculty: faculty
    })
    
    const deptId = faculty.department_id !== null && faculty.department_id !== undefined
      ? (typeof faculty.department_id === 'number' ? faculty.department_id : Number(faculty.department_id))
      : (faculty.Department?.id ? Number(faculty.Department.id) : '')
    
    setFormData({
      faculty_code: faculty.faculty_code || '',
      faculty_name: faculty.faculty_name || '',
      description: faculty.description || '',
      established_date: faculty.established_date || '',
      dean_id: faculty.dean_id || '',
      contact_email: faculty.contact_email || '',
      contact_phone: faculty.contact_phone || '',
      department_id: deptId === null ? '' : deptId,
      major_ids: faculty.major_ids || [],
      is_active: Boolean(faculty.is_active)
    })
    setShowModal(true)
  }

  const handleDelete = async (faculty) => {
    if (hasFacultyRelations(faculty)) {
      toast.error('Không thể xóa khoa vì đang có dữ liệu liên kết.')
      return
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa khoa "${faculty.faculty_name}"?`)) {
      return
    }

    try {
      await facultyAPI.delete(faculty.id)
      toast.success('Xóa khoa thành công')
      await loadData()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Chuẩn hóa department_id: nếu là empty string thì chuyển thành null, nếu là số thì giữ nguyên
      const submitData = {
        ...formData,
        department_id: formData.department_id === '' ? null : (typeof formData.department_id === 'number' ? formData.department_id : Number(formData.department_id))
      }
      
      if (modalType === 'create') {
        await facultyAPI.create(submitData)
        toast.success('Thêm khoa thành công')
      } else if (selectedFaculty) {
        await facultyAPI.update(selectedFaculty.id, submitData)
        toast.success('Cập nhật khoa thành công')
      }
      setShowModal(false)
      await loadData()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleDepartment = (majorId) => {
    setFormData((prev) => {
      const exists = prev.major_ids.includes(majorId)
      const next = exists
        ? prev.major_ids.filter((id) => id !== majorId)
        : [...prev.major_ids, majorId]
      return { ...prev, major_ids: next }
    })
  }

  const formatDate = (date) => {
    if (!date) return '—'
    try {
      return new Date(date).toLocaleDateString('vi-VN')
    } catch (error) {
      return date
    }
  }

  const getDeanDisplay = (faculty) => {
    if (faculty.dean_name) return faculty.dean_name
    if (faculty.Dean) {
      return `${faculty.Dean.first_name || ''} ${faculty.Dean.last_name || ''}`.trim() || faculty.Dean.email || 'Chưa bổ nhiệm'
    }
    return lecturers.find((lecturer) => lecturer.id === faculty.dean_id)?.name || 'Chưa bổ nhiệm'
  }

  const getFacultyMajorNames = (facultyId) => {
    return majors
      .filter((major) => major.faculty_id === facultyId)
      .map((major) => major.major_name)
  }

  const statsCards = [
    { label: 'Tổng số khoa', value: stats.total, icon: Building2, color: 'bg-blue-500' },
    { label: 'Đang hoạt động', value: stats.active, icon: CheckCircle2, color: 'bg-green-500' },
    { label: 'Ngừng hoạt động', value: stats.inactive, icon: Users, color: 'bg-gray-500' },
    { label: 'Đã bổ nhiệm trưởng khoa', value: stats.withDean, icon: Users, color: 'bg-indigo-500' }
  ]

  const handleLocalSearchChange = (value) => {
    if (searchTermOverride === undefined) {
      setSearchTerm(value)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          {showHeader && (
            <>
              {!embedded && (
                <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Quản lý cơ cấu tổ chức</p>
              )}
              <h1 className="text-3xl font-bold text-gray-900 mt-1">Quản lý khoa</h1>
              <p className="text-gray-600 mt-2">Theo dõi và cập nhật thông tin các khoa trong cơ cấu tổ chức.</p>
            </>
          )}
          {!showHeader && (
            <>
              <h2 className="text-2xl font-bold text-gray-900">Danh sách khoa</h2>
              <p className="text-gray-600 mt-2">Theo dõi và cập nhật thông tin từng khoa.</p>
            </>
          )}
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Thêm khoa</span>
        </button>
      </div>

      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card">
              <div className="flex items-center">
                <div className={`p-3 ${color} rounded-full`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{label}</p>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSearch && (
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo mã, tên khoa, trưởng khoa..."
                value={effectiveSearchTerm}
                onChange={(e) => handleLocalSearchChange(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              <Filter className="w-5 h-5" />
              <span>Bộ lọc</span>
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredFaculties.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
              <p className="text-gray-500">Chưa có khoa nào hoặc không có kết quả tìm kiếm.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Mã khoa</th>
                  <th className="table-header">Thông tin</th>
                  <th className="table-header">Trưởng khoa</th>
                  <th className="table-header">Ngày thành lập</th>
                  <th className="table-header">Đơn vị trực thuộc</th>
                  <th className="table-header">Liên hệ</th>
                  <th className="table-header">Trạng thái</th>
                  <th className="table-header w-32">Thao tác</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFaculties.map((faculty) => (
                  <tr key={faculty.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-blue-600">{faculty.faculty_code}</td>
                    <td className="table-cell">
                      <div className="font-medium text-gray-900">{faculty.faculty_name}</div>
                      {faculty.description ? (
                        <p className="text-sm text-gray-600 line-clamp-2 max-w-md">{faculty.description}</p>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">{getDeanDisplay(faculty)}</div>
                      <div className="text-xs text-gray-500">{faculty.Dean?.email || faculty.contact_email || '—'}</div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDate(faculty.established_date)}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      {faculty.Department?.department_name || faculty.department_name ? (
                        <span className="text-sm text-gray-900">
                          {faculty.Department?.department_name || faculty.department_name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-900">Đại Học Phenikaa</span>
                      )}
                    </td>
                    <td className="table-cell text-sm">
                      <div className="text-gray-900">{faculty.contact_email || '—'}</div>
                      <div className="text-gray-500">{faculty.contact_phone || '—'}</div>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          faculty.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {faculty.is_active ? 'Hoạt động' : 'Ngừng hoạt động'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(faculty)}
                          className="text-blue-600 hover:text-blue-900"
                          aria-label="Chỉnh sửa khoa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(faculty)}
                          className="text-red-600 hover:text-red-900"
                          aria-label="Xóa khoa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white my-8 flex flex-col max-h-[90vh]">
            <div className="pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {modalType === 'create' ? 'Thêm khoa mới' : 'Chỉnh sửa khoa'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã khoa *</label>
                  <input
                    type="text"
                    value={formData.faculty_code}
                    onChange={(e) => setFormData({ ...formData, faculty_code: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên khoa *</label>
                  <input
                    type="text"
                    value={formData.faculty_name}
                    onChange={(e) => setFormData({ ...formData, faculty_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trưởng khoa</label>
                  <select
                    value={formData.dean_id}
                    onChange={(e) => setFormData({ ...formData, dean_id: e.target.value ? Number(e.target.value) : '' })}
                    className="input-field"
                  >
                    <option value="">Chưa bổ nhiệm</option>
                    {lecturerOptions.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ngày thành lập</label>
                  <input
                    type="date"
                    value={formData.established_date}
                    onChange={(e) => setFormData({ ...formData, established_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị trực thuộc</label>
                <select
                  value={formData.department_id === '' ? '' : String(formData.department_id)}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value ? Number(e.target.value) : '' })}
                  className="input-field"
                >
                  <option value="">Chọn đơn vị</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email liên hệ</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="input-field"
                    placeholder="faculty@school.edu.vn"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="input-field"
                    placeholder="0901 234 567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                />
              </div>

              <div ref={departmentDropdownRef} className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngành trực thuộc</label>
                <button
                  type="button"
                  className="input-field flex justify-between items-center"
                  onClick={() => setDepartmentDropdownOpen((prev) => !prev)}
                >
                  <span>
                    {formData.major_ids.length === 0
                      ? 'Chọn ngành trực thuộc'
                      : `${formData.major_ids.length} ngành đã chọn`}
                  </span>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${departmentDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {departmentDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="p-2 border-b border-gray-100">
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Tìm kiếm ngành..."
                        value={departmentSearch}
                        onChange={(e) => setDepartmentSearch(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto p-2 space-y-1">
                      {filteredMajorsForDropdown.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-2">Không tìm thấy ngành phù hợp</p>
                      ) : (
                        filteredMajorsForDropdown.map((major) => (
                          <label key={major.id} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.major_ids.includes(major.id)}
                              onChange={() => toggleDepartment(major.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{major.major_name}</span>
                          </label>
                        ))
                      )}
                    </div>
                    {selectedMajorNames.length > 0 && (
                      <div className="border-t border-gray-100 p-2 flex flex-wrap gap-2">
                        {selectedMajorNames.map((name) => (
                          <span key={name} className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs">
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="border-t border-gray-100 p-2 text-right">
                      <button
                        type="button"
                        className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setDepartmentDropdownOpen(false)
                          setDepartmentSearch('')
                        }}
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-900">Đang hoạt động</span>
              </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn-primary">
                  {modalType === 'create' ? 'Tạo mới' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default FacultyManagement
