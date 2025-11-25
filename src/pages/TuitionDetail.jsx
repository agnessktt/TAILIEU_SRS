import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { programAPI, majorAPI } from '@/services/api'
import api from '@/services/api'
import toast from 'react-hot-toast'

const formatCurrency = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0)

export default function TuitionDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  const [majorDetail, setMajorDetail] = useState(null)
  const [loadingMajorDetail, setLoadingMajorDetail] = useState(false)
  const [programs, setPrograms] = useState([])

  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [pricePerCredit, setPricePerCredit] = useState('')
  const [tuition, setTuition] = useState(null)
  const [loadingTuition, setLoadingTuition] = useState(false)
  const [savingPrice, setSavingPrice] = useState(false)
  const [majorTuitionByYears, setMajorTuitionByYears] = useState(null)
  const [loadingMajorByYears, setLoadingMajorByYears] = useState(false)

  useEffect(() => {
    loadMajorDetail()
    loadPrograms()
  }, [id])

  useEffect(() => {
    if (selectedProgramId && programs.length) {
      const program = programs.find(p => p.id === Number(selectedProgramId))
      setSelectedProgram(program || null)
      if (program?.price_per_credit) {
        setPricePerCredit(String(program.price_per_credit))
      } else {
        setPricePerCredit('')
      }
      setTuition(null)
    } else {
      setSelectedProgram(null)
      setPricePerCredit('')
      setTuition(null)
    }
  }, [selectedProgramId, programs])

  const loadMajorDetail = async () => {
    try {
      setLoadingMajorDetail(true)
      const res = await majorAPI.getMajorsWithLatestPrograms()
      const list = res.data || []
      const target = list.find(item => String(item.id) === String(id))
      if (!target) {
        toast.error('Không tìm thấy ngành học')
        navigate('/tuition-calculator')
        return
      }
      setMajorDetail(target)
    } catch (error) {
      toast.error(error.message || 'Không thể tải dữ liệu ngành học')
      navigate('/tuition-calculator')
    } finally {
      setLoadingMajorDetail(false)
    }
  }

  const loadPrograms = async () => {
    try {
      const res = await programAPI.getAll()
      setPrograms(res.data || [])
    } catch (error) {
      toast.error('Không thể tải danh sách chương trình')
    }
  }

  const savePriceToProgram = async () => {
    if (!selectedProgramId) {
      toast.error('Vui lòng chọn chương trình đào tạo')
      return
    }
    if (pricePerCredit === '') {
      toast.error('Vui lòng nhập giá tín chỉ')
      return
    }
    const numericPrice = Number(pricePerCredit)
    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error('Giá tín chỉ phải là số dương')
      return
    }
    try {
      setSavingPrice(true)
      await api.put(`/programs/${selectedProgramId}/price`, { price_per_credit: numericPrice })
      toast.success('Đã lưu giá tín chỉ vào chương trình đào tạo')
      await loadPrograms()
      await loadMajorDetail()
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Không thể lưu giá tín chỉ')
    } finally {
      setSavingPrice(false)
    }
  }

  const fetchTuition = async () => {
    if (!selectedProgramId) {
      toast.error('Vui lòng chọn chương trình đào tạo')
      return
    }
    const priceParam = pricePerCredit !== '' ? Number(pricePerCredit) : null
    if (priceParam !== null && (!Number.isFinite(priceParam) || priceParam <= 0)) {
      toast.error('Giá tín chỉ phải là số dương')
      return
    }
    try {
      setLoadingTuition(true)
      const params = priceParam !== null ? { price_per_credit: priceParam } : {}
      const response = await api.get(`/tuition/${selectedProgramId}`, { params })
      setTuition(response.data)
    } catch (error) {
      toast.error(error.response?.data?.error || error.message || 'Không thể tính học phí')
      setTuition(null)
    } finally {
      setLoadingTuition(false)
    }
  }

  const fetchMajorTuitionByYears = async () => {
    if (!id) return
    try {
      setLoadingMajorByYears(true)
      const response = await majorAPI.getTuitionByYears(id)
      setMajorTuitionByYears(response.data)
    } catch (error) {
      toast.error(error.message || 'Không thể tính học phí tối thiểu của ngành theo năm')
      setMajorTuitionByYears(null)
    } finally {
      setLoadingMajorByYears(false)
    }
  }

  const availablePrograms = programs.filter(program => {
    if (!majorDetail) return false
    const programMajorId = program.major_id || program.Major?.id
    if (programMajorId && String(programMajorId) === String(majorDetail.id)) {
      return true
    }
    // fallback: if API chưa trả major_id, kiểm tra danh sách program của majorDetail
    return (majorDetail.programs || []).some(sp => sp.id === program.id)
  })

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Chi tiết học phí ngành</p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {majorDetail ? `${majorDetail.major_code} - ${majorDetail.major_name}` : 'Đang tải...'}
          </h1>
          {majorDetail?.latest_year && (
            <p className="text-sm text-gray-500 mt-2">Năm áp dụng mới nhất: {majorDetail.latest_year}</p>
          )}
        </div>
        <button
          onClick={() => navigate('/tuition-calculator')}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:text-gray-900 hover:border-gray-300 transition"
        >
          <span>Quay lại danh sách</span>
          <span className="text-lg">→</span>
        </button>
      </div>

      {loadingMajorDetail ? (
        <div className="text-center py-16 text-gray-500">Đang tải dữ liệu...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-sm font-medium text-blue-700">Số chương trình</p>
              <p className="text-3xl font-semibold text-blue-900 mt-2">{majorDetail?.programs?.length || 0}</p>
              <p className="text-xs text-blue-600/70 mt-1">Trong năm học mới nhất</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <p className="text-sm font-medium text-emerald-700">Tổng tín chỉ trung bình</p>
              <p className="text-3xl font-semibold text-emerald-900 mt-2">
                {majorDetail?.programs?.reduce((sum, p) => sum + (p.total_credits || 0), 0) || 0}
              </p>
              <p className="text-xs text-emerald-600/70 mt-1">Tổng tín chỉ các chương trình</p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
              <p className="text-sm font-medium text-orange-700">Năm học mới nhất</p>
              <p className="text-3xl font-semibold text-orange-900 mt-2">{majorDetail?.latest_year || '---'}</p>
              <p className="text-xs text-orange-600/70 mt-1">Dữ liệu cập nhật</p>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">Chương trình đào tạo</label>
                <select
                  value={selectedProgramId}
                  onChange={e => setSelectedProgramId(e.target.value)}
                  className="border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chọn chương trình đào tạo --</option>
                  {availablePrograms.map(program => (
                    <option key={program.id} value={program.id}>
                      {program.program_code} - {program.program_name}
                      {program.start_year ? ` (Năm ${program.start_year})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">Giá tín chỉ (VND)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={pricePerCredit}
                  onChange={e => setPricePerCredit(e.target.value)}
                  className="border rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập giá tín chỉ"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={savePriceToProgram}
                  disabled={savingPrice || !selectedProgramId || pricePerCredit === ''}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 disabled:opacity-50"
                >
                  {savingPrice ? 'Đang lưu...' : 'Lưu giá tín chỉ'}
                </button>
                <button
                  onClick={fetchTuition}
                  disabled={loadingTuition || !selectedProgramId}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loadingTuition ? 'Đang tính...' : 'Tính học phí'}
                </button>
              </div>
            </div>

            {tuition && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                  <p className="text-sm text-blue-700">Tổng số tín chỉ</p>
                  <p className="text-3xl font-semibold text-blue-900 mt-2">{tuition.tongSoTinChi}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-sm text-emerald-700">Tổng học phí</p>
                  <p className="text-3xl font-semibold text-emerald-900 mt-2">{formatCurrency(tuition.tongHocPhi)}</p>
                </div>
                <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-4">
                  <p className="text-sm text-purple-700">Giá tín chỉ áp dụng</p>
                  <p className="text-3xl font-semibold text-purple-900 mt-2">{formatCurrency(tuition.price_per_credit)}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                  <p className="text-sm text-orange-700">Học phí tối thiểu/năm</p>
                  <p className="text-3xl font-semibold text-orange-900 mt-2">{formatCurrency(tuition.tongHocPhi)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Học phí tối thiểu trong 5 năm gần đây</h3>
                <p className="text-sm text-gray-500">Theo dõi xu hướng học phí tối thiểu theo từng năm áp dụng.</p>
              </div>
              <button
                onClick={fetchMajorTuitionByYears}
                disabled={loadingMajorByYears}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 disabled:opacity-50"
              >
                {loadingMajorByYears ? 'Đang tải...' : 'Xem 5 năm gần đây'}
              </button>
            </div>

            {majorTuitionByYears && (
              <div className="mt-6 space-y-4">
                {majorTuitionByYears.years?.length ? (
                  [...majorTuitionByYears.years]
                    .sort((a, b) => (b.year || 0) - (a.year || 0))
                    .map(yearData => (
                    <div key={yearData.year} className="border border-gray-200 rounded-2xl p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <h4 className="text-lg font-semibold text-gray-900">Năm {yearData.year}</h4>
                        <span className="text-sm text-gray-500">{yearData.total_programs} chương trình</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="rounded-xl bg-blue-50 p-3">
                          <p className="text-xs text-gray-500">Tổng số tín chỉ</p>
                          <p className="text-xl font-semibold text-blue-700 mt-1">{yearData.tongSoTinChi}</p>
                        </div>
                        <div className="rounded-xl bg-orange-50 p-3">
                          <p className="text-xs text-gray-500">Học phí tối thiểu</p>
                          <p className="text-xl font-semibold text-orange-700 mt-1">{formatCurrency(yearData.tongHocPhiToiThieu)}</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 p-3">
                          <p className="text-xs text-gray-500">Số chương trình</p>
                          <p className="text-xl font-semibold text-emerald-700 mt-1">{yearData.total_programs}</p>
                        </div>
                      </div>

                      {yearData.programs?.length > 0 && (
                        <details className="mt-4">
                          <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                            Xem chi tiết ({yearData.programs.length})
                          </summary>
                          <div className="mt-3 overflow-x-auto border border-gray-100 rounded-2xl">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-gray-600 font-medium">Mã CTĐT</th>
                                  <th className="px-3 py-2 text-left text-gray-600 font-medium">Tên CTĐT</th>
                                  <th className="px-3 py-2 text-center text-gray-600 font-medium">Tổng TC</th>
                                  <th className="px-3 py-2 text-right text-gray-600 font-medium">Giá/TC</th>
                                  <th className="px-3 py-2 text-right text-gray-600 font-medium">Học phí</th>
                                </tr>
                              </thead>
                              <tbody>
                                {yearData.programs.map(program => (
                                  <tr key={program.program_id} className="border-t">
                                    <td className="px-3 py-2 font-semibold text-gray-900">{program.program_code}</td>
                                    <td className="px-3 py-2 text-gray-800">{program.program_name}</td>
                                    <td className="px-3 py-2 text-center">{program.total_credits}</td>
                                    <td className="px-3 py-2 text-right">{program.price_per_credit?.toLocaleString('vi-VN')} đ</td>
                                    <td className="px-3 py-2 text-right font-semibold">{program.hoc_phi?.toLocaleString('vi-VN')} đ</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-500">Không có dữ liệu học phí trong 5 năm gần đây</div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
