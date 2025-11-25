import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { programAPI, courseAPI, majorAPI } from '@/services/api'
import toast from 'react-hot-toast'

const CURRENT_YEAR = new Date().getFullYear()
const COURSE_TYPE_OPTIONS = [
  { value: 'Bắt buộc', label: 'Bắt buộc' },
  { value: 'Tự chọn', label: 'Tự chọn' },
  { value: 'Tự do', label: 'Tự do' }
]

function ProgramManagement() {
  const navigate = useNavigate()
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [majors, setMajors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [startYearFilter, setStartYearFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [modalForm, setModalForm] = useState({
    program_code: '',
    program_name: '',
    description: '',
    start_date: '',
    end_date: '',
    start_year: CURRENT_YEAR,
    is_active: true,
    major_id: '',
    knowledge_block_ids: [],
    course_ids: [],
    total_credits: ''
  })

  const parseCreditsValue = (value) => {
    if (value === null || value === undefined || value === '') return null
    const numberValue = Number(value)
    if (Number.isNaN(numberValue) || numberValue < 0) return null
    return numberValue
  }

  const fetchPrograms = async () => {
    try {
      setLoading(true)
      const res = await programAPI.getAll()
      const normalized = (res.data || []).map(item => {
        // Debug: Log Major data
        if (item.major_id && !item.Major) {
          console.warn(`[ProgramManagement] Program ${item.program_code} has major_id=${item.major_id} but no Major object`, item);
        }
        return {
          ...item,
          KnowledgeBlocks: Array.isArray(item.KnowledgeBlocks) ? item.KnowledgeBlocks : [],
          Courses: Array.isArray(item.Courses) ? item.Courses : [],
          Major: item.Major || null, // Ensure Major is preserved (can be null if not set or not found)
           TuitionYears: Array.isArray(item.TuitionYears)
             ? item.TuitionYears.sort((a, b) => b.year - a.year)
             : [],
          total_credits: parseCreditsValue(item.total_credits)
        }
      })
      setPrograms(normalized)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const res = await courseAPI.getAll()
      setCourses(res.data || [])
    } catch (e) {
      toast.error('Không thể tải danh sách học phần')
    }
  }

  const fetchMajors = async () => {
    try {
      const res = await majorAPI.getAll()
      setMajors(res.data || [])
    } catch (e) {
      toast.error('Không thể tải danh sách ngành học')
    }
  }

  useEffect(() => {
    fetchPrograms()
    fetchCourses()
    fetchMajors()
  }, [])

  const filteredPrograms = programs.filter((program) => {
    const keyword = searchKeyword.trim().toLowerCase()
    const matchKeyword =
      !keyword ||
      (program.program_code && program.program_code.toLowerCase().includes(keyword)) ||
      (program.program_name && program.program_name.toLowerCase().includes(keyword))

    const matchYear =
      !startYearFilter ||
      String(program.start_year || '').includes(startYearFilter.trim())

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && program.is_active) ||
      (statusFilter === 'inactive' && !program.is_active)

    return matchKeyword && matchYear && matchStatus
  })

  const buildProgramFormFromRecord = (record, overrides = {}) => {
    if (!record) {
      return {
        program_code: '',
        program_name: '',
        description: '',
        start_date: '',
        end_date: '',
        start_year: CURRENT_YEAR,
        is_active: true,
        major_id: '',
        knowledge_block_ids: [],
        course_ids: [],
        total_credits: ''
      }
    }
    const majorId = record.major_id || (record.Major && record.Major.id) || null
    const startYear = record.start_year || (record.start_date ? new Date(record.start_date).getFullYear() : CURRENT_YEAR)
    return {
      id: record.id,
      knowledge_block_ids: Array.isArray(record.KnowledgeBlocks) ? record.KnowledgeBlocks.map(kb => kb.id) : [],
      course_ids: Array.isArray(record.Courses) ? record.Courses.map(course => course.id) : [],
      program_code: record.program_code || '',
      program_name: record.program_name || '',
      start_date: record.start_date || '',
      end_date: record.end_date || '',
      description: record.description || '',
      is_active: record.is_active !== undefined ? record.is_active : true,
      major_id: majorId ? String(majorId) : '',
      start_year: startYear,
      total_credits: (() => {
        const parsed = parseCreditsValue(record.total_credits)
        return parsed === null ? '' : parsed
      })(),
      ...overrides
    }
  }

  const openCreateModal = () => {
    setModalType('create')
    setModalForm(buildProgramFormFromRecord(null))
    setShowModal(true)
  }

  const openEditModal = (p) => {
    setModalType('edit')
    setModalForm(buildProgramFormFromRecord(p))
    setShowModal(true)
  }

  const openCloneModal = (p) => {
    const suffixCode = p.program_code ? `${p.program_code}-COPY` : ''
    const suffixName = p.program_name ? `${p.program_name} (Copy)` : ''
    const form = buildProgramFormFromRecord(p, {
      id: undefined,
      program_code: suffixCode,
      program_name: suffixName
    })
    setModalType('clone')
    setModalForm(form)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const openDetailModal = (programId) => {
    navigate(`/chuong-trinh/${programId}`)
  }

  const handleModalChange = (e) => {
    const { name, value, type, checked } = e.target

    if (name === 'start_year') {
      const numeric = value === ''
        ? ''
        : Math.min(Math.max(Number(value) || CURRENT_YEAR, 2000), CURRENT_YEAR)
      setModalForm(prev => ({
        ...prev,
        start_year: numeric
      }))
      return
    }

    if (name === 'knowledge_block_ids' || name === 'course_ids') {
      // handled by checkbox below
    } else {
      setModalForm(prev => ({
        ...prev,
        [name]: type === 'checkbox'
          ? checked
          : type === 'number'
          ? (value === '' ? '' : Number(value))
          : value,
      }))
    }
  }

  const handleModalSubmit = async (e) => {
    e.preventDefault()
    const trimmedCode = modalForm.program_code.trim()
    const trimmedName = modalForm.program_name.trim()

    if (!trimmedCode || !trimmedName) {
      toast.error('Mã chương trình đào tạo và tên chương trình đào tạo là bắt buộc')
      return
    }
    try {
      const payload = {
        program_code: trimmedCode,
        program_name: trimmedName,
        description: modalForm.description,
        start_date: modalForm.start_date || '',
        end_date: modalForm.end_date || '',
        is_active: Boolean(modalForm.is_active),
        major_id: modalForm.major_id ? Number(modalForm.major_id) : null,
        knowledge_block_ids: Array.isArray(modalForm.knowledge_block_ids)
          ? modalForm.knowledge_block_ids.slice()
          : [],
        course_ids: Array.isArray(modalForm.course_ids)
          ? modalForm.course_ids.slice()
          : [],
        total_credits: modalForm.total_credits,
        start_year: modalForm.start_year || CURRENT_YEAR
      }

      if (modalType === 'create' || modalType === 'clone') {
        await programAPI.create(payload)
        toast.success(modalType === 'clone' ? 'Sao chép chương trình đào tạo thành công' : 'Tạo chương trình đào tạo thành công')
      } else {
        await programAPI.update(modalForm.id, payload)
        toast.success('Cập nhật chương trình đào tạo thành công')
      }
      closeModal()
      fetchPrograms()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa chương trình đào tạo này?')) return
    try {
      await programAPI.delete(id)
      toast.success('Đã xóa')
      fetchPrograms()
    } catch (e) {
      toast.error(e.message)
    }
  }


  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <h1 className="text-2xl font-semibold">Quản lý chương trình đào tạo</h1>
        <button onClick={openCreateModal} className="btn-primary flex items-center space-x-2">
          <span>+ Thêm chương trình đào tạo</span>
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên chương trình..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <input
          type="text"
          placeholder="Lọc năm bắt đầu..."
          value={startYearFilter}
          onChange={(e) => setStartYearFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-48"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none w-full md:w-48"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ngừng hoạt động</option>
        </select>
      </div>
      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalType === 'create' && 'Thêm chương trình đào tạo'}
                {modalType === 'edit' && 'Chỉnh sửa chương trình đào tạo'}
                {modalType === 'clone' && 'Sao chép chương trình đào tạo'}
              </h2>
              <button 
                onClick={closeModal} 
                className="text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-full p-2 transition-all duration-200 w-8 h-8 flex items-center justify-center"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            
            {/* Form Content */}
            <form onSubmit={handleModalSubmit} className="flex-1 overflow-y-auto">
              <div className="p-6 space-y-6">
                {/* Section: Thông tin cơ bản */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Thông tin cơ bản</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">
                        Mã chương trình đào tạo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="program_code"
                        value={modalForm.program_code}
                        onChange={handleModalChange}
                        placeholder="Nhập mã chương trình"
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">
                        Tên chương trình đào tạo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="program_name"
                        value={modalForm.program_name}
                        onChange={handleModalChange}
                        placeholder="Nhập tên chương trình"
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Mô tả</label>
                    <textarea
                      name="description"
                      rows={3}
                      value={modalForm.description}
                      onChange={handleModalChange}
                      placeholder="Nhập mô tả chương trình đào tạo..."
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none text-gray-800 placeholder-gray-400"
                    ></textarea>
                  </div>
                </div>

                {/* Section: Thông tin ngành học */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Thông tin ngành học</h3>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Thuộc ngành</label>
                    <select
                      name="major_id"
                      value={modalForm.major_id}
                      onChange={handleModalChange}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 bg-white"
                    >
                      <option value="">-- Chọn ngành học --</option>
                      {majors.map(major => (
                        <option key={major.id} value={major.id}>
                          {major.major_code} - {major.major_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Section: Thông tin thời gian */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Thông tin thời gian</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Ngày bắt đầu</label>
                      <input
                        type="date"
                        name="start_date"
                        value={modalForm.start_date}
                        onChange={handleModalChange}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Ngày kết thúc</label>
                      <input
                        type="date"
                        name="end_date"
                        value={modalForm.end_date}
                        onChange={handleModalChange}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">
                        Năm bắt đầu chương trình <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="start_year"
                        min={2000}
                        max={CURRENT_YEAR}
                        value={modalForm.start_year}
                        onChange={handleModalChange}
                        placeholder={`Từ 2000 đến ${CURRENT_YEAR}`}
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Tổng số tín chỉ</label>
                      <input
                        type="number"
                        name="total_credits"
                        min={0}
                        step={1}
                        value={modalForm.total_credits}
                        onChange={handleModalChange}
                        placeholder="Nhập tổng số tín chỉ"
                        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Trạng thái */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b">
                    <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
                    <h3 className="text-lg font-semibold text-gray-800">Trạng thái</h3>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      checked={modalForm.is_active}
                      onChange={handleModalChange}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Chương trình đang hoạt động
                    </label>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50 sticky bottom-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2.5 rounded-lg bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700 font-medium transition-all duration-200 shadow-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  {modalType === 'create' && 'Tạo mới'}
                  {modalType === 'edit' && 'Lưu thay đổi'}
                  {modalType === 'clone' && 'Sao chép'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Program List Table */}
      <div className="bg-white shadow rounded">
        <div className="p-4 border-b font-medium">Danh sách chương trình đào tạo</div>
        <div className="p-4 overflow-x-auto">
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Mã</th>
                  <th className="p-2">Tên chương trình đào tạo</th>
                  <th className="p-2">Hành động</th>
                  <th className="p-2">Ngành học</th>
                  <th className="p-2">Năm bắt đầu</th>
                  <th className="p-2">Tổng tín chỉ</th>
                  <th className="p-2">Ngày bắt đầu</th>
                  <th className="p-2">Ngày kết thúc</th>
                  <th className="p-2">Trạng thái</th>
                  <th className="p-2">Quản lý</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrograms.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.program_code}</td>
                    <td className="p-2">{p.program_name}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openDetailModal(p.id)}
                          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                          Xem chi tiết
                        </button>
                        <button
                          onClick={() => openCloneModal(p)}
                          className="px-3 py-1.5 rounded-lg border border-blue-200 text-sm font-medium text-blue-700 hover:bg-blue-50 transition"
                        >
                          Sao chép
                        </button>
                      </div>
                    </td>
                    <td className="p-2">
                      {p.Major ? (
                        <span className="text-gray-800" title={`ID: ${p.Major.id}`}>
                          {p.Major.major_code} - {p.Major.major_name}
                        </span>
                      ) : p.major_id ? (
                        <span className="text-orange-600" title={`major_id=${p.major_id} nhưng không tìm thấy thông tin ngành học. Có thể ngành học đã bị xóa.`}>
                          ID: {p.major_id} (Không tìm thấy)
                        </span>
                      ) : (
                        <span className="text-gray-400" title="Chưa gán ngành học">-</span>
                      )}
                    </td>
                  <td className="p-2">{p.start_year || '-'}</td>
                    <td className="p-2">{p.total_credits ?? '-'}</td>
                    <td className="p-2">{p.start_date || '-'}</td>
                    <td className="p-2">{p.end_date || '-'}</td>
                    <td className="p-2">{p.is_active ? 'Active' : 'Inactive'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-3">
                        <button onClick={() => openEditModal(p)} className="text-blue-600 hover:underline">Sửa</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProgramManagement
