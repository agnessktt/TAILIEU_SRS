import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { programAPI, courseAPI, knowledgeBlockAPI } from '@/services/api'
import toast from 'react-hot-toast'

const COURSE_TYPE_OPTIONS = [
  { value: 'Bắt buộc', label: 'Bắt buộc' },
  { value: 'Tự chọn', label: 'Tự chọn' },
  { value: 'Tự do', label: 'Tự do' }
]

function ProgramDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detailProgram, setDetailProgram] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [programCourses, setProgramCourses] = useState([])
  const [programCoursesLoading, setProgramCoursesLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [knowledgeBlocks, setKnowledgeBlocks] = useState([])
  const [knowledgeBlocksLoading, setKnowledgeBlocksLoading] = useState(false)
  const [showAddCourseModal, setShowAddCourseModal] = useState(false)
  const [showAddBlockModal, setShowAddBlockModal] = useState(false)
  const [selectedKnowledgeBlockId, setSelectedKnowledgeBlockId] = useState('')
  const [addCourseForm, setAddCourseForm] = useState({
    course_id: '',
    course_type: '',
    semester: '',
    knowledge_block_id: ''
  })
  const [savingProgramCourse, setSavingProgramCourse] = useState(false)
  const [removingProgramCourseId, setRemovingProgramCourseId] = useState(null)
  const [addingKnowledgeBlock, setAddingKnowledgeBlock] = useState(false)
  const [removingKnowledgeBlockId, setRemovingKnowledgeBlockId] = useState(null)
  const [showEditCourseModal, setShowEditCourseModal] = useState(false)
  const [editingCourseEntry, setEditingCourseEntry] = useState(null)
  const [editCourseForm, setEditCourseForm] = useState({
    course_type: '',
    semester: ''
  })
  const [updatingProgramCourse, setUpdatingProgramCourse] = useState(false)
  const [courseSearchTerm, setCourseSearchTerm] = useState('')
  const [addCourseBlockSearch, setAddCourseBlockSearch] = useState('')
  const [knowledgeBlockSearchTerm, setKnowledgeBlockSearchTerm] = useState('')
  const [editingBlockCreditsId, setEditingBlockCreditsId] = useState(null)
  const [blockCreditsInput, setBlockCreditsInput] = useState('')
  const [savingBlockCreditsId, setSavingBlockCreditsId] = useState(null)

  useEffect(() => {
    if (id) {
      fetchProgramDetail(id)
      fetchProgramCourses(id)
      fetchCourses()
    }
  }, [id])

  useEffect(() => {
    fetchKnowledgeBlocks()
  }, [])

  const fetchProgramDetail = async (programId) => {
    try {
      setDetailLoading(true)
      const res = await programAPI.getById(programId)
      setDetailProgram(res.data)
    } catch (e) {
      toast.error('Không thể tải chi tiết chương trình')
      navigate('/programs')
    } finally {
      setDetailLoading(false)
    }
  }

  const fetchProgramCourses = async (programId) => {
    try {
      setProgramCoursesLoading(true)
      const res = await programAPI.getCourses(programId)
      setProgramCourses(res.data || [])
    } catch (e) {
      toast.error('Không thể tải danh sách học phần của chương trình')
    } finally {
      setProgramCoursesLoading(false)
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

  const fetchKnowledgeBlocks = async () => {
    try {
      setKnowledgeBlocksLoading(true)
      const res = await knowledgeBlockAPI.getAll()
      setKnowledgeBlocks(res.data || [])
    } catch (error) {
      toast.error(error.message || 'Không thể tải danh sách khối kiến thức')
    } finally {
      setKnowledgeBlocksLoading(false)
    }
  }

  const openAddCourseModal = () => {
    setAddCourseForm({
      course_id: '',
      course_type: '',
      semester: '',
      knowledge_block_id: ''
    })
    setShowAddCourseModal(true)
  }

  const closeAddCourseModal = () => {
    setShowAddCourseModal(false)
  }

  const openAddBlockModal = () => {
    setSelectedKnowledgeBlockId('')
    setShowAddBlockModal(true)
  }

  const closeAddBlockModal = () => {
    setShowAddBlockModal(false)
  }

  const handleAddCourseFormChange = (e) => {
    const { name, value } = e.target
    setAddCourseForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddCourseSubmit = async (e) => {
    e.preventDefault()
    if (!id) return
    if (!addCourseForm.course_id) {
      toast.error('Vui lòng chọn học phần')
      return
    }
    if (!addCourseForm.course_type) {
      toast.error('Vui lòng chọn loại học phần')
      return
    }
    try {
      setSavingProgramCourse(true)
      const normalizedSemester = addCourseForm.semester === '' ? null : Number(addCourseForm.semester)
      await programAPI.addCourse(id, {
        course_id: Number(addCourseForm.course_id),
        course_type: addCourseForm.course_type,
        semester: Number.isFinite(normalizedSemester) ? normalizedSemester : null,
        knowledge_block_id: addCourseForm.knowledge_block_id ? Number(addCourseForm.knowledge_block_id) : null
      })
      toast.success('Đã thêm học phần vào chương trình')
      closeAddCourseModal()
      fetchProgramCourses(id)
      fetchProgramDetail(id)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSavingProgramCourse(false)
    }
  }

  const handleRemoveProgramCourse = async (courseId) => {
    if (!id) return
    if (!confirm('Bạn có chắc muốn xóa học phần này khỏi chương trình?')) return
    try {
      setRemovingProgramCourseId(courseId)
      await programAPI.removeCourse(id, courseId)
      toast.success('Đã xóa học phần khỏi chương trình')
      fetchProgramCourses(id)
      fetchProgramDetail(id)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setRemovingProgramCourseId(null)
    }
  }

  const handleAddKnowledgeBlock = async (e) => {
    e.preventDefault()
    if (!selectedKnowledgeBlockId) {
      toast.error('Vui lòng chọn khối kiến thức')
      return
    }
    try {
      setAddingKnowledgeBlock(true)
      await programAPI.addKnowledgeBlock(id, {
        knowledge_block_id: Number(selectedKnowledgeBlockId)
      })
      toast.success('Đã thêm khối kiến thức vào chương trình')
      setShowAddBlockModal(false)
      setSelectedKnowledgeBlockId('')
      fetchProgramDetail(id)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setAddingKnowledgeBlock(false)
    }
  }

  const handleRemoveKnowledgeBlock = async (blockId) => {
    if (!confirm('Bạn có chắc muốn xóa khối kiến thức này khỏi chương trình?')) return
    try {
      setRemovingKnowledgeBlockId(blockId)
      await programAPI.removeKnowledgeBlock(id, blockId)
      toast.success('Đã xóa khối kiến thức khỏi chương trình')
      fetchProgramDetail(id)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setRemovingKnowledgeBlockId(null)
    }
  }

  const openEditCourseModal = (courseRelation) => {
    setEditingCourseEntry(courseRelation)
    setEditCourseForm({
      course_type: courseRelation.course_type || '',
    semester: courseRelation.semester ?? '',
    knowledge_block_id: courseRelation.knowledge_block_id ? String(courseRelation.knowledge_block_id) : ''
    })
    setShowEditCourseModal(true)
  }

  const closeEditCourseModal = () => {
    setShowEditCourseModal(false)
    setEditingCourseEntry(null)
    setEditCourseForm({
    course_type: '',
    semester: '',
    knowledge_block_id: ''
    })
  }

  const handleEditCourseFormChange = (e) => {
    const { name, value } = e.target
    setEditCourseForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditCourseSubmit = async (e) => {
    e.preventDefault()
    if (!editingCourseEntry) return
    if (!editCourseForm.course_type) {
      toast.error('Vui lòng chọn loại học phần')
      return
    }
  const payload = {
    course_type: editCourseForm.course_type
  }
    if (editCourseForm.semester === '' || editCourseForm.semester === null) {
      payload.semester = null
    } else if (!Number.isInteger(Number(editCourseForm.semester))) {
      toast.error('Học kỳ phải là số nguyên')
      return
    } else {
      payload.semester = Number(editCourseForm.semester)
    }
  payload.knowledge_block_id = editCourseForm.knowledge_block_id
    ? Number(editCourseForm.knowledge_block_id)
    : null
    try {
      setUpdatingProgramCourse(true)
      await programAPI.updateCourse(id, editingCourseEntry.course_id, payload)
      toast.success('Đã cập nhật học phần')
      closeEditCourseModal()
      fetchProgramCourses(id)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setUpdatingProgramCourse(false)
    }
  }

  const availableCoursesForProgram = courses
    .filter(course => !programCourses.some(pc => pc.course_id === course.id))
    .sort((a, b) => (a.course_name || '').localeCompare(b.course_name || '', 'vi', { sensitivity: 'base' }))
  const programKnowledgeBlocks = detailProgram?.KnowledgeBlocks || []
  const availableKnowledgeBlocks = (knowledgeBlocks || []).filter(
    block => !programKnowledgeBlocks.some(existing => existing.id === block.id)
  )
  const filteredAvailableCourses = availableCoursesForProgram.filter(course => {
    const keyword = courseSearchTerm.trim().toLowerCase()
    if (!keyword) return true
    return (
      (course.course_code || '').toLowerCase().includes(keyword) ||
      (course.course_name || '').toLowerCase().includes(keyword)
    )
  })
  const filteredProgramKnowledgeBlocks = programKnowledgeBlocks.filter(block => {
    const keyword = addCourseBlockSearch.trim().toLowerCase()
    if (!keyword) return true
    return (
      (block.block_code || '').toLowerCase().includes(keyword) ||
      (block.block_name || '').toLowerCase().includes(keyword)
    )
  })
  const filteredAvailableKnowledgeBlocks = availableKnowledgeBlocks.filter(block => {
    const keyword = knowledgeBlockSearchTerm.trim().toLowerCase()
    if (!keyword) return true
    return (
      (block.block_code || '').toLowerCase().includes(keyword) ||
      (block.block_name || '').toLowerCase().includes(keyword)
    )
  })
  const blockCreditsMap = programCourses.reduce((acc, relation) => {
    if (!relation.knowledge_block_id) return acc
    const courseCredits = relation.Course?.total_credits || 0
    acc[relation.knowledge_block_id] = (acc[relation.knowledge_block_id] || 0) + courseCredits
    return acc
  }, {})

  const getBlockCreditLabel = (block) => {
    const hasTotal = typeof block.total_credits === 'number' && !Number.isNaN(block.total_credits)
    if (hasTotal) {
      return `${block.total_credits} tín chỉ`
    }
    const minDefined = block.min_credits !== null && block.min_credits !== undefined
    const maxDefined = block.max_credits !== null && block.max_credits !== undefined
    if (minDefined && maxDefined) {
      return `${block.min_credits} - ${block.max_credits} tín chỉ`
    }
    if (minDefined) {
      return `Tối thiểu ${block.min_credits} tín chỉ`
    }
    if (maxDefined) {
      return `Tối đa ${block.max_credits} tín chỉ`
    }
    return 'Chưa cập nhật tín chỉ'
  }

  const startEditBlockCredits = (block) => {
    setEditingBlockCreditsId(block.id)
    setBlockCreditsInput(
      block.total_credits !== null && block.total_credits !== undefined
        ? String(block.total_credits)
        : ''
    )
  }

  const cancelEditBlockCredits = () => {
    setEditingBlockCreditsId(null)
    setBlockCreditsInput('')
  }

  const handleSaveBlockCredits = async (blockId) => {
    if (blockCreditsInput === '') {
      toast.error('Vui lòng nhập số tín chỉ')
      return
    }
    const parsed = Number(blockCreditsInput)
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error('Số tín chỉ phải là số không âm')
      return
    }
    if (!id) return
    try {
      setSavingBlockCreditsId(blockId)
      await knowledgeBlockAPI.update(blockId, { total_credits: parsed })
      toast.success('Đã cập nhật tín chỉ khối')
      cancelEditBlockCredits()
      fetchKnowledgeBlocks()
      fetchProgramDetail(id)
    } catch (error) {
      toast.error(error.message || 'Không thể cập nhật tín chỉ khối')
    } finally {
      setSavingBlockCreditsId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Chi tiết chương trình đào tạo</p>
            <h1 className="text-3xl font-semibold text-gray-900 mt-1">
              {detailProgram?.program_name || 'Đang tải...'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-4">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium">
                <span className="text-xs uppercase tracking-wide text-blue-600/80">Mã chương trình</span>
                <span className="text-base font-semibold">{detailProgram?.program_code || '---'}</span>
              </span>
              <span className="inline-flex px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-700">
                Bắt đầu: <span className="ml-2 text-gray-900">{detailProgram?.start_year || '-'}</span>
              </span>
              <span className={`inline-flex px-4 py-2 rounded-xl text-sm font-semibold ${detailProgram?.is_active ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                {detailProgram?.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/programs')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300 transition-colors"
            >
              <span>Quay lại danh sách</span>
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
      </div>

      {detailLoading ? (
        <div className="py-16 text-center text-gray-500">Đang tải thông tin chương trình...</div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-sm font-medium text-blue-700">Tổng số tín chỉ</p>
              <p className="text-3xl font-semibold text-blue-900 mt-2">{detailProgram?.total_credits ?? '-'}</p>
              <p className="text-xs text-blue-600/70 mt-1">Dựa trên cấu trúc CTĐT hiện tại</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-sm font-medium text-emerald-700">Thời gian dự kiến</p>
              <p className="text-3xl font-semibold text-emerald-900 mt-2">
                {detailProgram?.start_year ? `${detailProgram.start_year}` : '---'}
              </p>
              <p className="text-xs text-emerald-600/70 mt-1">Năm bắt đầu áp dụng</p>
            </div>
            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4">
              <p className="text-sm font-medium text-purple-700">Số khối kiến thức</p>
              <p className="text-3xl font-semibold text-purple-900 mt-2">{detailProgram?.KnowledgeBlocks?.length || 0}</p>
              <p className="text-xs text-purple-600/70 mt-1">Đang gắn với chương trình</p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="text-sm font-medium text-orange-700">Số học phần</p>
              <p className="text-3xl font-semibold text-orange-900 mt-2">{programCourses.length}</p>
              <p className="text-xs text-orange-600/70 mt-1">Học phần đang sử dụng</p>
            </div>
          </div>
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Mô tả tổng quan</h3>
              <p className="text-sm text-gray-500 mt-2">
                {detailProgram?.description || 'Chưa có mô tả cho chương trình đào tạo này.'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Khối kiến thức</h3>
                  <p className="text-sm text-gray-500">Quản lý các khối kiến thức thuộc chương trình.</p>
                </div>
                <button
                  onClick={openAddBlockModal}
                  disabled={knowledgeBlocksLoading || availableKnowledgeBlocks.length === 0}
                  className="self-start px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 disabled:opacity-50"
                >
                  + Thêm khối kiến thức
                </button>
              </div>
              {knowledgeBlocksLoading ? (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-2xl">Đang tải danh sách khối kiến thức...</div>
              ) : detailProgram?.KnowledgeBlocks?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {detailProgram.KnowledgeBlocks.map(block => {
                    const assignedCredits = blockCreditsMap[block.id] || 0
                    const isEditingBlock = editingBlockCreditsId === block.id
                    return (
                    <div key={block.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/70 hover:bg-white transition">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{block.block_name}</p>
                          <p className="text-xs uppercase tracking-wide text-gray-500 mt-1">
                            {block.block_code ? block.block_code : 'Chưa có mã'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${block.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                            {block.is_active ? 'Hoạt động' : 'Ngưng'}
                          </span>
                          <button
                            onClick={() => handleRemoveKnowledgeBlock(block.id)}
                            disabled={removingKnowledgeBlockId === block.id}
                            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                          >
                            {removingKnowledgeBlockId === block.id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm text-gray-600">
                          Tổng chỉ tiêu: <span className="font-semibold text-gray-900">{getBlockCreditLabel(block)}</span>
                        </p>
                      <p className="text-sm text-gray-700 mt-1">
                        Đã gán: <span className="font-semibold text-gray-900">{assignedCredits}</span> tín chỉ
                      </p>
                        {isEditingBlock ? (
                          <div className="space-y-2">
                            <input
                              type="number"
                              min={0}
                              value={blockCreditsInput}
                              onChange={e => setBlockCreditsInput(e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                              placeholder="Nhập số tín chỉ"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleSaveBlockCredits(block.id)}
                                disabled={savingBlockCreditsId === block.id}
                                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-60"
                              >
                                {savingBlockCreditsId === block.id ? 'Đang lưu...' : 'Lưu'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditBlockCredits}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Hủy
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditBlockCredits(block)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Chỉnh sửa tín chỉ
                          </button>
                        )}
                      </div>
                    </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-2xl">
                  Chưa có khối kiến thức nào.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Danh sách học phần</h3>
                <p className="text-sm text-gray-500 mt-1">Quản lý học phần thuộc chương trình đào tạo hiện tại.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={openAddCourseModal}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-gray-300 disabled:opacity-60"
                  disabled={programCoursesLoading || availableCoursesForProgram.length === 0 || programKnowledgeBlocks.length === 0}
                  title={
                    programKnowledgeBlocks.length === 0
                      ? 'Vui lòng thêm khối kiến thức trước'
                      : availableCoursesForProgram.length === 0
                      ? 'Đã sử dụng toàn bộ học phần'
                      : 'Thêm học phần'
                  }
                >
                  + Thêm học phần
                </button>
              </div>
            </div>
            {programCoursesLoading ? (
              <div className="p-6 text-center text-gray-500">Đang tải danh sách học phần...</div>
            ) : programCourses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left bg-gray-50">
                      <th className="p-4 font-medium text-gray-600">Mã học phần</th>
                      <th className="p-4 font-medium text-gray-600">Tên học phần</th>
                      <th className="p-4 font-medium text-gray-600">Số tín chỉ</th>
                      <th className="p-4 font-medium text-gray-600">Khối kiến thức</th>
                      <th className="p-4 font-medium text-gray-600">Loại</th>
                      <th className="p-4 font-medium text-gray-600">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programCourses.map((item) => {
                      const course = item.Course || {}
                      return (
                        <tr key={`${item.id}-${item.course_id}`} className="border-t hover:bg-gray-50/70 transition">
                          <td className="p-4 font-semibold text-gray-900">{course.course_code || '---'}</td>
                          <td className="p-4 text-gray-800">{course.course_name || '---'}</td>
                          <td className="p-4">{course.total_credits ?? '-'}</td>
                          <td className="p-4">
                            {item.KnowledgeBlock ? (
                              <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                                {item.KnowledgeBlock.block_code || item.KnowledgeBlock.block_name}
                              </span>
                            ) : (
                              <span className="text-gray-400">Chưa gán</span>
                            )}
                          </td>
                          <td className="p-4">
                            {item.course_type ? (
                              <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                                {item.course_type}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => openEditCourseModal(item)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleRemoveProgramCourse(item.course_id)}
                                className="text-red-600 hover:text-red-700 hover:underline text-sm font-medium disabled:opacity-50"
                                disabled={removingProgramCourseId === item.course_id}
                              >
                                {removingProgramCourseId === item.course_id ? 'Đang xóa...' : 'Xóa'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">Chưa có học phần nào trong chương trình.</div>
            )}
          </div>
        </div>
      )}

      {showAddCourseModal && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/40" onClick={closeAddCourseModal} />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Thêm học phần vào chương trình</h3>
                <button onClick={closeAddCourseModal} className="text-gray-500 hover:text-gray-700 text-xl px-2">✕</button>
              </div>
            </div>
            {availableCoursesForProgram.length === 0 ? (
              <div className="px-6 pb-6 text-sm text-gray-500">
                Tất cả học phần đã được thêm vào chương trình này.
              </div>
            ) : (
              <form className="flex flex-col flex-1 overflow-hidden" onSubmit={handleAddCourseSubmit}>
                <div className="px-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tìm nhanh học phần</label>
                  <input
                    type="text"
                    value={courseSearchTerm}
                    onChange={e => setCourseSearchTerm(e.target.value)}
                    placeholder="Nhập mã hoặc tên học phần..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Chọn học phần *</label>
                  <select
                    name="course_id"
                    value={addCourseForm.course_id}
                    onChange={handleAddCourseFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Chọn học phần --</option>
                    {filteredAvailableCourses.length === 0 && (
                      <option value="" disabled>Không tìm thấy học phần phù hợp</option>
                    )}
                    {filteredAvailableCourses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.course_code ? `${course.course_code} - ` : ''}{course.course_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium mb-1">Khối kiến thức *</label>
                  {programKnowledgeBlocks.length === 0 ? (
                    <p className="text-sm text-gray-500">Vui lòng thêm khối kiến thức trước khi gán học phần.</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={addCourseBlockSearch}
                        onChange={e => setAddCourseBlockSearch(e.target.value)}
                        placeholder="Nhập mã hoặc tên khối..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <select
                      name="knowledge_block_id"
                      value={addCourseForm.knowledge_block_id}
                      onChange={handleAddCourseFormChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      required
                    >
                        <option value="">-- Chọn khối --</option>
                        {filteredProgramKnowledgeBlocks.length === 0 && (
                          <option value="" disabled>Không tìm thấy khối phù hợp</option>
                        )}
                      {filteredProgramKnowledgeBlocks.map(block => (
                        <option key={block.id} value={block.id}>
                          {block.block_code ? `${block.block_code} - ` : ''}{block.block_name}
                        </option>
                      ))}
                      </select>
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loại học phần *</label>
                  <select
                    name="course_type"
                    value={addCourseForm.course_type}
                    onChange={handleAddCourseFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Chọn loại --</option>
                    {COURSE_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Học kỳ (tuỳ chọn)</label>
                  <input
                    type="number"
                    name="semester"
                    min={1}
                    value={addCourseForm.semester}
                    onChange={handleAddCourseFormChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                </div>
                <div className="flex justify-end gap-3 p-6 pt-4 border-t bg-white">
                  <button
                    type="button"
                    onClick={closeAddCourseModal}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={savingProgramCourse}
                  >
                    {savingProgramCourse ? 'Đang thêm...' : 'Thêm vào chương trình'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showAddBlockModal && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center overflow-y-auto">
          <div className="absolute inset-0 bg-black/40" onClick={closeAddBlockModal} />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Thêm khối kiến thức</h3>
                <button onClick={closeAddBlockModal} className="text-gray-500 hover:text-gray-700 text-xl px-2">✕</button>
              </div>
            </div>
            {availableKnowledgeBlocks.length === 0 ? (
              <div className="px-6 pb-6 text-sm text-gray-500">
                Tất cả khối kiến thức đã được gắn vào chương trình này.
              </div>
            ) : (
              <form className="flex flex-col flex-1 overflow-hidden" onSubmit={handleAddKnowledgeBlock}>
                <div className="px-6 overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tìm nhanh khối kiến thức</label>
                  <input
                    type="text"
                    value={knowledgeBlockSearchTerm}
                    onChange={e => setKnowledgeBlockSearchTerm(e.target.value)}
                    placeholder="Nhập mã hoặc tên khối..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Chọn khối kiến thức *</label>
                  <select
                    value={selectedKnowledgeBlockId}
                    onChange={e => setSelectedKnowledgeBlockId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    required
                  >
                    <option value="">-- Chọn khối kiến thức --</option>
                    {filteredAvailableKnowledgeBlocks.length === 0 && (
                      <option value="" disabled>Không tìm thấy khối phù hợp</option>
                    )}
                    {filteredAvailableKnowledgeBlocks.map(block => (
                      <option key={block.id} value={block.id}>
                        {block.block_code ? `${block.block_code} - ` : ''}{block.block_name}
                      </option>
                    ))}
                  </select>
                </div>
                </div>
                <div className="flex justify-end gap-3 p-6 pt-4 border-t bg-white">
                  <button
                    type="button"
                    onClick={closeAddBlockModal}
                    className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    disabled={addingKnowledgeBlock}
                  >
                    {addingKnowledgeBlock ? 'Đang thêm...' : 'Thêm khối kiến thức'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showEditCourseModal && editingCourseEntry && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeEditCourseModal} />
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa học phần</h3>
              <button onClick={closeEditCourseModal} className="text-gray-500 hover:text-gray-700 text-xl px-2">✕</button>
            </div>
            <form className="space-y-4" onSubmit={handleEditCourseSubmit}>
              <div>
                <label className="block text-sm font-medium mb-1">Loại học phần *</label>
                <select
                  name="course_type"
                  value={editCourseForm.course_type}
                  onChange={handleEditCourseFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn loại --</option>
                  {COURSE_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Học kỳ (tuỳ chọn)</label>
                <input
                  type="number"
                  name="semester"
                  min={1}
                  value={editCourseForm.semester}
                  onChange={handleEditCourseFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Khối kiến thức *</label>
                <select
                  name="knowledge_block_id"
                  value={editCourseForm.knowledge_block_id}
                  onChange={handleEditCourseFormChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                >
                  <option value="">-- Chọn khối --</option>
                  {programKnowledgeBlocks.map(block => (
                    <option key={block.id} value={block.id}>
                      {block.block_code ? `${block.block_code} - ` : ''}{block.block_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditCourseModal}
                  className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={updatingProgramCourse}
                >
                  {updatingProgramCourse ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgramDetail

