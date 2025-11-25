import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Calendar, BookOpen } from 'lucide-react'
import { cohortAPI, courseAPI, employeeAPI, programAPI, majorAPI } from '@/services/api'
import toast from 'react-hot-toast'

const CohortManagement = () => {
  const [cohorts, setCohorts] = useState([])
  const [courses, setCourses] = useState([])
  const [programs, setPrograms] = useState([])
  const [majors, setMajors] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [selectedCohort, setSelectedCohort] = useState(null)
  const [formData, setFormData] = useState({
    cohort_code: '',
    cohort_name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'planning',
    course_id: '',
    program_id: '',
    major_id: '',
    instructor_id: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [cohortsRes, coursesRes, employeesRes, programsRes, majorsRes] = await Promise.all([
        cohortAPI.getAll(),
        courseAPI.getAll(),
        employeeAPI.getAll(),
        programAPI.getAll(),
        majorAPI.getAll()
      ])
      setCohorts(cohortsRes.data)
      setCourses(coursesRes.data)
      setEmployees(employeesRes.data)
      setPrograms(programsRes.data)
      setMajors(majorsRes.data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getTimelineStatus = (cohort) => {
    const now = new Date()
    const startDate = cohort.start_date ? new Date(cohort.start_date) : null
    const endDate = cohort.end_date ? new Date(cohort.end_date) : null

    if (startDate && now < startDate) return 'planning'
    if (startDate && (!endDate || now <= endDate)) return 'active'
    if (endDate && now > endDate) return 'completed'
    return cohort.status || 'planning'
  }

  const filteredCohorts = cohorts.filter(c => {
    const matchSearch =
      c.cohort_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cohort_code.toLowerCase().includes(searchTerm.toLowerCase())
    const derivedStatus = getTimelineStatus(c)
    const matchStatus = statusFilter === 'all' || derivedStatus === statusFilter
    return matchSearch && matchStatus
  })

  const handleCreate = () => {
    setModalType('create')
    setSelectedCohort(null)
    setFormData({
      cohort_code: '',
      cohort_name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'planning',
      course_id: '',
      program_id: '',
      major_id: '',
      instructor_id: ''
    })
    setShowModal(true)
  }

  const handleEdit = (c) => {
    setModalType('edit')
    setSelectedCohort(c)
    setFormData({
      cohort_code: c.cohort_code,
      cohort_name: c.cohort_name,
      description: c.description || '',
      start_date: c.start_date,
      end_date: c.end_date || '',
      status: c.status,
      course_id: c.course_id || '',
      program_id: c.program_id || '',
      major_id: c.major_id || '',
      instructor_id: c.instructor_id || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (c) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa khóa ${c.cohort_name}?`)) {
      try {
        await cohortAPI.delete(c.id)
        await loadData()
        toast.success('Xóa khóa học thành công!')
      } catch (error) {
        toast.error(error.message)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (modalType === 'create') {
        await cohortAPI.create(formData)
        toast.success('Tạo khóa học thành công!')
      } else {
        await cohortAPI.update(selectedCohort.id, formData)
        toast.success('Cập nhật khóa học thành công!')
      }
      await loadData()
      setShowModal(false)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'planning': return 'Đang lên kế hoạch'
      case 'active': return 'Đang tiến hành'
      case 'completed': return 'Đã hoàn thành'
      default: return 'Đang lên kế hoạch'
    }
  }

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'Chưa xác định'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý khóa học</h1>
          <p className="text-gray-600 mt-2">Quản lý các khóa học (K17, K18, ...)</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Thêm khóa học</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500 rounded-full">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Tổng khóa học</p>
              <p className="text-2xl font-bold">{cohorts.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-500 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Đang học</p>
              <p className="text-2xl font-bold">{cohorts.filter(c => c.status === 'active').length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-gray-500 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Đã kết thúc</p>
              <p className="text-2xl font-bold">{cohorts.filter(c => c.status === 'completed').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            placeholder="Tìm kiếm khóa học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-md px-3 py-2 w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="planning">Đang lên kế hoạch</option>
            <option value="active">Đang tiến hành</option>
            <option value="completed">Đã hoàn thành</option>
          </select>
        </div>
        <button className="flex items-center border rounded-md px-4 py-2">
          <Filter className="w-5 h-5 mr-2" /> Bộ lọc nâng cao
        </button>
      </div>

      {/* Table */}
      {!loading && (
        <div className="bg-white shadow sm:rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Mã khóa</th>
                <th className="table-header">Tên khóa học</th>
                <th className="table-header">Ngành</th>
                <th className="table-header">Chương trình đào tạo</th>
                <th className="table-header">Thời gian</th>
                <th className="table-header">Trạng thái</th>
                <th className="table-header">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCohorts.map(c => {
                const timelineStatus = getTimelineStatus(c)
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-blue-600">{c.cohort_code}</td>
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{c.cohort_name}</div>
                    <div className="text-sm text-gray-500">{c.description}</div>
                  </td>
                  <td className="table-cell">
                    {c.Major ? `${c.Major.major_code} - ${c.Major.major_name}` : <span className="text-gray-400">Chưa gán ngành</span>}
                  </td>
                  <td className="table-cell">
                    {c.Program ? c.Program.program_name : <span className="text-gray-400">Chưa gán CTĐT</span>}
                  </td>
                  <td className="table-cell">
                    {formatDate(c.start_date)} – {formatDate(c.end_date)}
                  </td>
                  <td className="table-cell">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(timelineStatus)}`}>
                      {getStatusText(timelineStatus)}
                    </span>
                  </td>
                  <td className="table-cell flex space-x-2">
                    <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c)} className="text-red-600 hover:text-red-900">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-start justify-center py-10 px-4">
            <div className="bg-white rounded-md w-full max-w-xl shadow-lg my-8 flex flex-col max-h-[90vh]">
              <div className="p-6 pb-4">
                <h3 className="text-lg font-semibold mb-4">
                  {modalType === 'create' ? 'Thêm khóa học mới' : 'Chỉnh sửa khóa học'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="px-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Mã khóa *</label>
                  <input
                    type="text"
                    value={formData.cohort_code}
                    onChange={(e) => setFormData({ ...formData, cohort_code: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tên khóa học *</label>
                  <input
                    type="text"
                    value={formData.cohort_name}
                    onChange={(e) => setFormData({ ...formData, cohort_name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Ngày bắt đầu *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Ngành</label>
                <select
                  value={formData.major_id}
                  onChange={(e) => setFormData({ ...formData, major_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Chọn ngành</option>
                  {majors.map(m => (
                    <option key={m.id} value={m.id}>{m.major_code} - {m.major_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Chương trình đào tạo</label>
                <select
                  value={formData.program_id}
                  onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">Chọn CTĐT</option>
                  {programs
                    .filter(p => !formData.major_id || p.major_id === Number(formData.major_id))
                    .map(p => (
                      <option key={p.id} value={p.id}>{p.program_code} - {p.program_name}</option>
                    ))}
                </select>
              </div>

                </div>
                <div className="flex justify-end space-x-3 p-6 pt-4 border-t bg-white">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
                  <button type="submit" className="btn-primary">
                    {modalType === 'create' ? 'Tạo mới' : 'Cập nhật'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CohortManagement
