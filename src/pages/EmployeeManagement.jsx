import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, User, Mail, Phone, MapPin } from 'lucide-react'
import { employeeAPI } from '@/services/api'
import toast from 'react-hot-toast'

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [formData, setFormData] = useState({
    user_id: '',
    full_name: '',
    gender: 'Nam',
    position: '',
    degree: '',
    organization_unit_id: '',
    email: '',
    phone: '',
    address: '',
    active: 'Đang làm việc',
    role: 'staff'
  })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await employeeAPI.getAll()
      setEmployees(res.data)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || emp.active === statusFilter
    const matchesRole = roleFilter === 'all' || emp.role === roleFilter
    return matchesSearch && matchesStatus && matchesRole
  })

  const handleCreate = () => {
    setModalType('create')
    setSelectedEmployee(null)
    setFormData({
      user_id: '',
      full_name: '',
      gender: 'Nam',
      position: '',
      degree: '',
      organization_unit_id: '',
      email: '',
      phone: '',
      address: '',
      active: 'Đang làm việc',
      role: 'staff'
    })
    setShowModal(true)
  }

  const handleEdit = (emp) => {
    setModalType('edit')
    setSelectedEmployee(emp)
    setFormData(emp)
    setShowModal(true)
  }

  const handleDelete = async (emp) => {
    if (window.confirm(`Xóa nhân sự ${emp.full_name}?`)) {
      try {
        await employeeAPI.delete(emp.id)
        await loadData()
        toast.success('Xóa thành công!')
      } catch (error) {
        toast.error(error.message)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (modalType === 'create') {
        await employeeAPI.create(formData)
        toast.success('Thêm nhân sự thành công!')
      } else {
        await employeeAPI.update(selectedEmployee.id, formData)
        toast.success('Cập nhật nhân sự thành công!')
      }
      await loadData()
      setShowModal(false)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đang làm việc': return 'bg-green-100 text-green-800'
      case 'Nghỉ việc': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý nhân sự</h1>
          <p className="text-gray-600 mt-2">Quản lý giảng viên và nhân viên hành chính</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Thêm nhân sự</span>
        </button>
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              placeholder="Tìm kiếm theo mã, tên hoặc email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md w-72"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="lecturer">Giảng viên</option>
            <option value="staff">Nhân viên hành chính</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang làm việc">Đang làm việc</option>
            <option value="Nghỉ việc">Nghỉ việc</option>
          </select>
        </div>
        <button className="flex items-center border rounded-md px-4 py-2">
          <Filter className="w-5 h-5 mr-2" />
          <span>Bộ lọc nâng cao</span>
        </button>
      </div>

      {/* Bảng danh sách */}
      {!loading && (
        <div className="bg-white shadow rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="table-header">Mã</th>
                <th className="table-header">Họ tên</th>
                <th className="table-header">Giới tính</th>
                <th className="table-header">Chức vụ</th>
                <th className="table-header">Đơn vị</th>
                <th className="table-header">Email</th>
                <th className="table-header">Trạng thái</th>
                <th className="table-header">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-blue-600">{emp.user_id}</td>
                  <td className="table-cell">{emp.full_name}</td>
                  <td className="table-cell">{emp.gender}</td>
                  <td className="table-cell">{emp.position}</td>
                  <td className="table-cell">{emp.OrganizationUnit?.name || 'Đại Học Phenikaa'}</td>
                  <td className="table-cell">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      {emp.email}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(emp.active)}`}>
                      {emp.active}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-900"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(emp)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-start justify-center py-10 px-4">
            <div className="bg-white rounded-lg shadow-md w-full max-w-2xl my-8 flex flex-col max-h-[90vh]">
              <div className="p-6 pb-4">
                <h3 className="text-lg font-semibold mb-4">
                  {modalType === 'create' ? 'Thêm nhân sự' : 'Chỉnh sửa nhân sự'}
                </h3>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="px-6 overflow-y-auto flex-1 space-y-3">
              <input type="text" placeholder="Mã nhân sự" value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })} className="input-field" required />
              <input type="text" placeholder="Họ và tên" value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="input-field" required />
              <input type="text" placeholder="Chức vụ" value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input-field" required />
              <input type="text" placeholder="Học vị (nếu có)" value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })} className="input-field" />
              <input type="text" placeholder="Đơn vị công tác (để trống = Đại Học Phenikaa)" value={formData.organization_unit_id || ''}
                onChange={(e) => setFormData({ ...formData, organization_unit_id: e.target.value })} className="input-field" />
              <input type="email" placeholder="Email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input-field" />
              <input type="text" placeholder="Số điện thoại" value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input-field" />
              <textarea placeholder="Địa chỉ" value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input-field" />
              <select value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="input-field">
                <option value="lecturer">Giảng viên</option>
                <option value="staff">Nhân viên hành chính</option>
              </select>
              <select value={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.value })} className="input-field">
                <option value="Đang làm việc">Đang làm việc</option>
                <option value="Nghỉ việc">Nghỉ việc</option>
              </select>
                </div>
                <div className="flex justify-end space-x-3 p-6 pt-4 border-t bg-white">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Hủy</button>
                  <button type="submit" className="btn-primary">Lưu</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeeManagement
