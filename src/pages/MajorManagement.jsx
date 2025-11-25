import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, GraduationCap, Clock, User, Award, Building } from 'lucide-react'
import { majorAPI, departmentAPI, employeeAPI, facultyAPI } from '@/services/api'
import toast from 'react-hot-toast'

const MajorManagement = () => {
  const [majors, setMajors] = useState([])
  const [departments, setDepartments] = useState([])
  const [faculties, setFaculties] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [degreeFilter, setDegreeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [selectedMajor, setSelectedMajor] = useState(null)
  const [formData, setFormData] = useState({
    major_code: '',
    major_name: '',
    description: '',
    degree_type: 'bachelor',
    duration_years: 4,
    total_credits: 120,
    department_id: '',
    faculty_id: '',
    head_of_major_id: '',
    is_active: true
  })

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [majorsRes, departmentsRes, employeesRes, facultiesRes] = await Promise.all([
        majorAPI.getAll(),
        departmentAPI.getAll(),
        employeeAPI.getAll(),
        facultyAPI.getAll()
      ])
      
      setMajors(majorsRes.data)
      setDepartments(departmentsRes.data)
      setEmployees(employeesRes.data)
      setFaculties(facultiesRes.data || [])
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredMajors = majors.filter(major => {
    const matchesSearch = 
      major.major_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      major.major_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (major.Department?.department_name && major.Department.department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (major.Faculty?.faculty_name && major.Faculty.faculty_name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDegree = degreeFilter === 'all' || major.degree_type === degreeFilter
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? major.is_active : !major.is_active)
    
    return matchesSearch && matchesDegree && matchesStatus
  })

  const handleCreate = () => {
    setModalType('create')
    setSelectedMajor(null)
    setFormData({
      major_code: '',
      major_name: '',
      description: '',
      degree_type: 'bachelor',
      duration_years: 4,
      total_credits: 120,
      department_id: '',
      head_of_major_id: '',
      is_active: true
    })
    setShowModal(true)
  }

  const handleEdit = (major) => {
    setModalType('edit')
    setSelectedMajor(major)
    setFormData({
      major_code: major.major_code,
      major_name: major.major_name,
      description: major.description || '',
      degree_type: major.degree_type,
      duration_years: major.duration_years,
      total_credits: major.total_credits,
      department_id: major.department_id || '',
      faculty_id: major.faculty_id || '',
      head_of_major_id: major.head_of_major_id || '',
      is_active: major.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (major) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa ngành học ${major.major_name}?`)) {
      try {
        await majorAPI.delete(major.id)
        await loadData() // Reload data
        toast.success('Xóa ngành học thành công!')
      } catch (error) {
        toast.error(error.message)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (modalType === 'create') {
        await majorAPI.create(formData)
        toast.success('Tạo ngành học thành công!')
      } else {
        await majorAPI.update(selectedMajor.id, formData)
        toast.success('Cập nhật ngành học thành công!')
      }
      
      await loadData() // Reload data
      setShowModal(false)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getDegreeColor = (degreeType) => {
    switch (degreeType) {
      case 'associate': return 'bg-blue-100 text-blue-800'
      case 'bachelor': return 'bg-green-100 text-green-800'
      case 'master': return 'bg-purple-100 text-purple-800'
      case 'doctorate': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDegreeText = (degreeType) => {
    switch (degreeType) {
      case 'associate': return 'Cao đẳng'
      case 'bachelor': return 'Cử nhân'
      case 'master': return 'Thạc sĩ'
      case 'doctorate': return 'Tiến sĩ'
      default: return degreeType
    }
  }

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  const getStatusText = (isActive) => {
    return isActive ? 'Hoạt động' : 'Không hoạt động'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý ngành học</h1>
          <p className="text-gray-600 mt-2">Quản lý các ngành học và chương trình đào tạo</p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm ngành học</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-full">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng ngành học</p>
              <p className="text-2xl font-bold text-gray-900">{majors.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-full">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cử nhân</p>
              <p className="text-2xl font-bold text-gray-900">
                {majors.filter(m => m.degree_type === 'bachelor').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500 rounded-full">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Thạc sĩ</p>
              <p className="text-2xl font-bold text-gray-900">
                {majors.filter(m => m.degree_type === 'master').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-red-500 rounded-full">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tiến sĩ</p>
              <p className="text-2xl font-bold text-gray-900">
                {majors.filter(m => m.degree_type === 'doctorate').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Tìm kiếm ngành học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          <select
            value={degreeFilter}
            onChange={(e) => setDegreeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả bậc học</option>
            <option value="associate">Cao đẳng</option>
            <option value="bachelor">Cử nhân</option>
            <option value="master">Thạc sĩ</option>
            <option value="doctorate">Tiến sĩ</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>
        
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          <Filter className="w-5 h-5" />
          <span>Bộ lọc nâng cao</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white shadow sm:rounded-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Mã ngành</th>
                <th className="table-header">Tên ngành học</th>
                <th className="table-header">Bậc học</th>
                <th className="table-header">Thời gian</th>
                <th className="table-header">Khoa</th>
                <th className="table-header">Trưởng ngành</th>
                <th className="table-header">Trạng thái</th>
                <th className="table-header w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMajors.map((major) => (
                <tr key={major.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-blue-600">{major.major_code}</td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">{major.major_name}</div>
                      {major.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{major.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDegreeColor(major.degree_type)}`}>
                      {getDegreeText(major.degree_type)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-1" />
                      {major.duration_years} năm
                    </div>
                  </td>
                  <td className="table-cell">
                    {major.Faculty ? (
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">{major.Faculty.faculty_name}</div>
                          {major.Faculty.faculty_code && (
                            <div className="text-sm text-gray-500">{major.Faculty.faculty_code}</div>
                          )}
                        </div>
                      </div>
                    ) : major.Department ? (
                      <div className="flex items-center">
                        <Building className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="font-medium text-gray-900">{major.Department.department_name}</div>
                          <div className="text-sm text-gray-500">{major.Department.department_code}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Chưa gán khoa</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {major.HeadOfMajor ? (
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {major.HeadOfMajor.first_name} {major.HeadOfMajor.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{major.HeadOfMajor.email}</div>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Chưa gán trưởng ngành</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(major.is_active)}`}>
                      {getStatusText(major.is_active)}
                    </span>
                  </td>
                  <td className="table-cell whitespace-nowrap">
                    <div className="flex space-x-2 justify-start">
                      <button
                        onClick={() => handleEdit(major)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(major)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white my-8 flex flex-col max-h-[90vh]">
            <div className="mt-3 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalType === 'create' ? 'Thêm ngành học mới' : 'Chỉnh sửa thông tin ngành học'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã ngành học *
                    </label>
                    <input
                      type="text"
                      value={formData.major_code}
                      onChange={(e) => setFormData({...formData, major_code: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên ngành học *
                    </label>
                    <input
                      type="text"
                      value={formData.major_name}
                      onChange={(e) => setFormData({...formData, major_name: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-field"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bậc học
                    </label>
                    <select
                      value={formData.degree_type}
                      onChange={(e) => setFormData({...formData, degree_type: e.target.value})}
                      className="input-field"
                    >
                      <option value="associate">Cao đẳng</option>
                      <option value="bachelor">Cử nhân</option>
                      <option value="master">Thạc sĩ</option>
                      <option value="doctorate">Tiến sĩ</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời gian (năm)
                    </label>
                    <input
                      type="number"
                      value={formData.duration_years}
                      onChange={(e) => setFormData({...formData, duration_years: parseInt(e.target.value) || 4})}
                      className="input-field"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Khoa
                    </label>
                    <select
                      value={formData.faculty_id}
                      onChange={(e) => setFormData({...formData, faculty_id: e.target.value})}
                      className="input-field"
                    >
                      <option value="">Chọn khoa</option>
                      {faculties.map(fac => (
                        <option key={fac.id} value={fac.id}>{fac.faculty_name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trưởng ngành
                    </label>
                    <select
                      value={formData.head_of_major_id}
                      onChange={(e) => setFormData({...formData, head_of_major_id: e.target.value})}
                      className="input-field"
                    >
                      <option value="">Chọn trưởng ngành</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Ngành học đang hoạt động
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
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

export default MajorManagement
