import React, { useState, useEffect } from 'react'
import {
  Plus, Edit, Trash2, Search, Filter, BookOpen, Clock, GraduationCap, Building2, Link as LinkIcon
} from 'lucide-react'
import Select from 'react-select'
import { courseAPI, courseCategoryAPI, departmentAPI, facultyAPI } from '@/services/api'
import toast from 'react-hot-toast'

const SubjectManagement = () => {
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [departments, setDepartments] = useState([])
  const [faculties, setFaculties] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [schoolFilter, setSchoolFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [selectedCourse, setSelectedCourse] = useState(null)

  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    description: '',
    total_credits: '',
    theory_credits: '',
    practice_credits: '',
    managing_department_id: '',
    managing_faculty_id: '',
    category_id: '',
    duration_hours: '',
    level: 'Beginner',
    prerequisite_course_ids: [],
    concurrent_course_ids: [],
    prior_course_ids: [],
    learning_objectives: ''
  })

  // ===== Modal scroll/ESC handler =====
  useEffect(() => {
    if (showModal) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    const onKey = (e) => e.key === 'Escape' && setShowModal(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showModal])

  // ===== Load Data =====
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadCourses(), loadCategories(), loadDepartments(), loadFaculties()])
    } catch (error) {
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const parseSafe = (val) => {
    if (!val) return []
    if (Array.isArray(val)) return val
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return val.split(',').map(v => parseInt(v.trim())).filter(Boolean)
      }
    }
    return []
  }

  const loadCourses = async () => {
    try {
      const response = await courseAPI.getAll()
      const processed = (response.data || []).map(c => ({
        ...c,
        prerequisite_course_ids: parseSafe(c.prerequisite_course_ids),
        concurrent_course_ids: parseSafe(c.concurrent_course_ids),
        prior_course_ids: parseSafe(c.prior_course_ids)
      }))
      setCourses(processed)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const loadCategories = async () => {
    try {
      const res = await courseCategoryAPI.getAll()
      setCategories(res.data || [])
    } catch { }
  }

  const loadDepartments = async () => {
    try {
      const res = await departmentAPI.getAll()
      setDepartments(res.data || [])
    } catch { }
  }

  const loadFaculties = async () => {
    try {
      const res = await facultyAPI.getAll()
      setFaculties(res.data || [])
    } catch { }
  }

  // ===== Filtering =====
  // Lấy danh sách các khoa (Faculty) thuộc trường (Department loại 'school') đã chọn
  const getFacultiesBySchool = (schoolId) => {
    if (schoolId === 'all') return new Set()
    const selectedSchoolId = parseInt(schoolId)
    // Lấy các khoa có department_id = selectedSchoolId (thuộc trường)
    return new Set(
      faculties
        .filter(faculty => faculty.department_id === selectedSchoolId)
        .map(faculty => faculty.id)
    )
  }
  
  const filteredCourses = courses.filter(course => {
    const matchSearch =
      (course.course_name && course.course_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.course_code && course.course_code.toLowerCase().includes(searchTerm.toLowerCase()))
    
    // Lọc theo trường (Department loại 'school'): hiển thị các học phần thuộc trường hoặc thuộc các khoa của trường
    if (schoolFilter === 'all') {
      return matchSearch
    }
    
    const selectedSchoolId = parseInt(schoolFilter)
    const facultyIds = getFacultiesBySchool(schoolFilter)
    
    // Học phần trực tiếp thuộc trường (qua department_id)
    const belongsToSchool = course.department_id === selectedSchoolId || 
                           course.managing_department_id === selectedSchoolId
    
    // Học phần thuộc các khoa của trường (qua faculty_id)
    const belongsToFaculty = course.faculty_id && facultyIds.has(course.faculty_id) ||
                            course.managing_faculty_id && facultyIds.has(course.managing_faculty_id)
    
    return matchSearch && (belongsToSchool || belongsToFaculty)
  })
  
  // Lấy danh sách các trường (Department loại 'school')
  const schools = departments.filter(dept => dept.department_type === 'school')

  // ===== Utility =====
  const getCourseNamesByIds = (ids) => {
    if (!ids || (Array.isArray(ids) && ids.length === 0)) return 'Không có'

    let parsedIds = []
    if (typeof ids === 'string') {
      try {
        parsedIds = JSON.parse(ids)
        if (!Array.isArray(parsedIds)) parsedIds = ids.split(',').map(v => parseInt(v.trim()))
      } catch {
        parsedIds = ids.split(',').map(v => parseInt(v.trim()))
      }
    } else {
      parsedIds = ids
    }

    const names = parsedIds
      .map(id => {
        const c = courses.find(x => x.id === id)
        if (!c) return `ID:${id}`
        return `${c.course_code} - ${c.course_name}`
      })
      .filter(Boolean)

    return names.length > 0 ? names.join(', ') : 'Không có'
  }

  // ===== CRUD Handlers =====
  const handleCreate = () => {
    setModalType('create')
    setSelectedCourse(null)
    setFormData({
      course_code: '',
      course_name: '',
      description: '',
      total_credits: '',
      theory_credits: '',
      practice_credits: '',
      managing_department_id: '',
      managing_faculty_id: '',
      category_id: '',
      duration_hours: '',
      level: 'Beginner',
      prerequisite_course_ids: [],
      concurrent_course_ids: [],
      prior_course_ids: [],
      learning_objectives: ''
    })
    setShowModal(true)
  }

  const handleEdit = (course) => {
    setModalType('edit')
    setSelectedCourse(course)
    setFormData({
      course_code: course.course_code || '',
      course_name: course.course_name || '',
      description: course.description || '',
      total_credits: course.total_credits || '',
      theory_credits: course.theory_credits || '',
      practice_credits: course.practice_credits || '',
      managing_department_id: course.managing_department_id || course.department_id || '',
      managing_faculty_id: course.managing_faculty_id || course.faculty_id || '',
      category_id: course.category_id || '',
      duration_hours: course.duration_hours || '',
      level: course.level || 'Beginner',
      prerequisite_course_ids: parseSafe(course.prerequisite_course_ids),
      concurrent_course_ids: parseSafe(course.concurrent_course_ids),
      prior_course_ids: parseSafe(course.prior_course_ids),
      learning_objectives: course.learning_objectives || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (course) => {
    if (!window.confirm(`Xóa học phần ${course.course_name}?`)) return
    try {
      await courseAPI.delete(course.id)
      toast.success('Đã xóa!')
      loadCourses()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const total = parseInt(formData.total_credits) || 0
      const lt = parseInt(formData.theory_credits) || 0
      const th = parseInt(formData.practice_credits) || 0
      if (lt + th !== total) {
        toast.error('Tổng tín chỉ LT và TH phải bằng tổng số tín chỉ!')
        return
      }

      const processedData = {
        ...formData,
        faculty_id: formData.managing_faculty_id || null,
        department_id: formData.managing_department_id || null,
        prerequisite_course_ids: Array.isArray(formData.prerequisite_course_ids)
          ? JSON.stringify(formData.prerequisite_course_ids)
          : '[]',
        concurrent_course_ids: Array.isArray(formData.concurrent_course_ids)
          ? JSON.stringify(formData.concurrent_course_ids)
          : '[]',
        prior_course_ids: Array.isArray(formData.prior_course_ids)
          ? JSON.stringify(formData.prior_course_ids)
          : '[]'
      }
      // Xóa các field không cần thiết
      delete processedData.managing_department_id
      delete processedData.managing_faculty_id

      if (modalType === 'create') {
        await courseAPI.create(processedData)
        toast.success('Tạo thành công!')
      } else {
        await courseAPI.update(selectedCourse.id, processedData)
        toast.success('Cập nhật thành công!')
      }
      setShowModal(false)
      loadCourses()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getLevelColor = (lvl) => {
    switch (lvl) {
      case 'Beginner': return 'bg-green-100 text-green-800'
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800'
      case 'Advanced': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelText = (lvl) => {
    switch (lvl) {
      case 'Beginner': return 'Cơ bản'
      case 'Intermediate': return 'Trung cấp'
      case 'Advanced': return 'Nâng cao'
      default: return lvl
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const courseOptions = courses.map(c => ({
    value: c.id, label: `${c.course_code} - ${c.course_name}`
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý học phần</h1>
          <p className="text-gray-600 mt-2">Quản lý học phần và môn học trong hệ thống</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" /><span>Thêm học phần</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[{ icon: BookOpen, color: 'bg-blue-500', title: 'Tổng học phần', value: courses.length },
        { icon: GraduationCap, color: 'bg-green-500', title: 'Tổng tín chỉ', value: courses.reduce((s, c) => s + (c.total_credits || 0), 0) },
        { icon: Clock, color: 'bg-yellow-500', title: 'Tổng giờ học', value: courses.reduce((s, c) => s + (c.duration_hours || 0), 0) },
        { icon: Building2, color: 'bg-purple-500', title: 'Khoa quản lý', value: departments.length }].map((card, i) => (
          <div key={i} className="card flex items-center">
            <div className={`${card.color} p-3 rounded-full`}><card.icon className="w-6 h-6 text-white" /></div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm học phần..."
              className="pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <select 
            value={schoolFilter} 
            onChange={e => setSchoolFilter(e.target.value)} 
            className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trường</option>
            {schools.map(school => (
              <option key={school.id} value={school.id}>{school.department_name}</option>
            ))}
          </select>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border rounded-md hover:bg-gray-50">
          <Filter className="w-5 h-5" /><span>Bộ lọc nâng cao</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-x-auto sm:rounded-md">
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Không có dữ liệu</h3>
            <p className="text-gray-500">Không có học phần phù hợp.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Mã HP', 'Tên học phần', 'Tín chỉ', 'TC LT/TH', 'Khoa quản lý', 'HP tiên quyết', 'HP song hành', 'Cấp độ', 'Thao tác'].map((h, i) => (
                  <th key={i} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCourses.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-blue-600">{c.course_code}</td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">{c.course_name}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{c.description}</div>
                    </div>
                  </td>
                  <td className="table-cell">{c.total_credits}</td>
                  <td className="table-cell">
                    <div className="text-sm"><span className="text-green-600">LT:</span> {c.theory_credits || 0} <span className="text-orange-600 ml-2">TH:</span> {c.practice_credits || 0}</div>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-1" />
                      {c.Faculty?.faculty_name || faculties.find(f => f.id === c.faculty_id)?.faculty_name || c.Department?.department_name || departments.find(d => d.id === c.managing_department_id || d.id === c.department_id)?.department_name || 'N/A'}
                    </div>
                  </td>
                  <td className="table-cell">{getCourseNamesByIds(c.prerequisite_course_ids)}</td>
                  <td className="table-cell">{getCourseNamesByIds(c.concurrent_course_ids)}</td>
                  <td className="table-cell">
                    <span className={`px-2 py-1 rounded-full text-xs ${getLevelColor(c.level)}`}>{getLevelText(c.level)}</span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-900"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-xl my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 pb-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{modalType === 'create' ? 'Thêm học phần' : 'Chỉnh sửa học phần'}</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="px-6 overflow-y-auto flex-1 space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">Mã học phần *</label>
      <input
        type="text"
        value={formData.course_code}
        onChange={e => setFormData({ ...formData, course_code: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-1">Tên học phần *</label>
      <input
        type="text"
        value={formData.course_name}
        onChange={e => setFormData({ ...formData, course_name: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        required
      />
    </div>
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">Mô tả</label>
    <textarea
      rows={3}
      value={formData.description}
      onChange={e => setFormData({ ...formData, description: e.target.value })}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
    ></textarea>
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">Khoa quản lý</label>
    <select
      value={formData.managing_faculty_id || ''}
      onChange={e => setFormData({ ...formData, managing_faculty_id: e.target.value })}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
    >
      <option value="">Chọn khoa</option>
      {faculties.map(f => (
        <option key={f.id} value={f.id}>{f.faculty_name} ({f.faculty_code})</option>
      ))}
    </select>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">Tổng tín chỉ</label>
      <input
        type="number"
        value={formData.total_credits}
        onChange={e => setFormData({ ...formData, total_credits: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Tín chỉ LT</label>
      <input
        type="number"
        value={formData.theory_credits}
        onChange={e => setFormData({ ...formData, theory_credits: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Tín chỉ TH</label>
      <input
        type="number"
        value={formData.practice_credits}
        onChange={e => setFormData({ ...formData, practice_credits: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Số giờ học</label>
      <input
        type="number"
        value={formData.duration_hours}
        onChange={e => setFormData({ ...formData, duration_hours: e.target.value })}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block text-sm font-medium mb-1">Học phần tiên quyết</label>
      <Select
        isMulti
        options={courseOptions}
        value={courseOptions.filter(opt => formData.prerequisite_course_ids.includes(opt.value))}
        onChange={selected => setFormData({
          ...formData,
          prerequisite_course_ids: selected.map(s => s.value)
        })}
        className="basic-multi-select"
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-1">Học phần song hành</label>
      <Select
        isMulti
        options={courseOptions}
        value={courseOptions.filter(opt => formData.concurrent_course_ids.includes(opt.value))}
        onChange={selected => setFormData({
          ...formData,
          concurrent_course_ids: selected.map(s => s.value)
        })}
        className="basic-multi-select"
      />
    </div>
  </div>

  <div>
    <label className="block text-sm font-medium mb-1">Mục tiêu học tập</label>
    <textarea
      rows={3}
      value={formData.learning_objectives}
      onChange={e => setFormData({ ...formData, learning_objectives: e.target.value })}
      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
    ></textarea>
  </div>

  <div className="flex items-center space-x-4 pt-2">
    <label className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={formData.is_active}
        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
      />
      <span>Hoạt động</span>
    </label>
  </div>

              </div>
              <div className="flex justify-end space-x-3 p-6 pt-4 border-t bg-white">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {modalType === "create" ? "Tạo mới" : "Lưu thay đổi"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}

export default SubjectManagement
