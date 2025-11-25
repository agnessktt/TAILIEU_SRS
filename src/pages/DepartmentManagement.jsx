import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, Building, Users, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { departmentAPI, positionAPI, userAPI, facultyAPI } from '@/services/api'
import FacultyManagement from '@/pages/FacultyManagement'

const DepartmentManagement = () => {
  const [activeTab, setActiveTab] = useState('departments')
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [facultyList, setFacultyList] = useState([])
  const [departmentUsage, setDepartmentUsage] = useState({})
  const [positionUsage, setPositionUsage] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [facultySearchTerm, setFacultySearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [selectedItem, setSelectedItem] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'active'
  })

  const [facultyStats, setFacultyStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withDean: 0
  })

  // Load dữ liệu khi component mount
  useEffect(() => {
    loadData()
  }, [])

  // Tự động set đơn vị mặc định khi tạo mới chức vụ
  useEffect(() => {
    if (activeTab === 'positions' && showModal && modalType === 'create') {
      // Set "Đại Học Phenikaa" làm mặc định (giá trị đặc biệt "phenikaa")
      if (!formData.department_id || formData.department_id === '') {
        setFormData(prev => ({ ...prev, department_id: 'phenikaa' }))
      }
    }
  }, [activeTab, modalType, showModal])

  // Load dữ liệu từ API
  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadDepartments(),
        loadPositions(),
        loadUsageData()
      ])
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const response = await departmentAPI.getAll()
      console.log('Departments loaded:', response.data)
      setDepartments(response.data || [])
    } catch (error) {
      console.error('Error loading departments:', error)
      toast.error(error.message)
    }
  }

  const loadPositions = async () => {
    try {
      const response = await positionAPI.getAll()
      console.log('Positions loaded:', response.data)
      setPositions(response.data || [])
    } catch (error) {
      console.error('Error loading positions:', error)
      toast.error(error.message)
    }
  }

  const loadUsageData = async () => {
    try {
      const [staffRes, lecturerRes, facultyRes] = await Promise.all([
        userAPI.getAllByRole('staff'),
        userAPI.getAllByRole('lecturer'),
        facultyAPI.getAll()
      ])
      setFacultyList(facultyRes.data || [])

      const deptUsage = {}
      const posUsage = {}

      const increment = (map, rawKey) => {
        if (rawKey === undefined || rawKey === null || rawKey === '' || rawKey === 'phenikaa') return
        const key = String(rawKey)
        map[key] = (map[key] || 0) + 1
      }

      const allUsers = [
        ...(staffRes.data || []),
        ...(lecturerRes.data || [])
      ]

      allUsers.forEach(user => {
        increment(deptUsage, user.organization_unit_id ?? user.department_id)
        increment(posUsage, user.position_id)
      })

      setDepartmentUsage(deptUsage)
      setPositionUsage(posUsage)
    } catch (error) {
      console.error('Error loading usage data:', error)
    }
  }

  // Bộ lọc tìm kiếm
  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = 
      (dept.department_name && dept.department_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (dept.department_code && dept.department_code.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = typeFilter === 'all' || dept.department_type === typeFilter
    
    return matchesSearch && matchesType
  })

  const filteredPositions = positions.filter(pos =>
    (pos.position_name && pos.position_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (pos.position_code && pos.position_code.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getDepartmentRelationIssues = (deptId) => {
    if (!deptId) return []
    const key = String(deptId)
    const issues = []
    if (departmentUsage[key]) issues.push('nhân sự trực thuộc')
    if (positions.some(pos => pos.department_id && String(pos.department_id) === key)) issues.push('chức vụ trực thuộc')
    if (facultyList.some(fac => fac.department_id && String(fac.department_id) === key)) issues.push('khoa trực thuộc')
    if (departments.some(dep => dep.parent_department_id && String(dep.parent_department_id) === key)) issues.push('đơn vị con')
    return issues
  }

  const getPositionRelationIssues = (positionId) => {
    if (!positionId) return []
    const key = String(positionId)
    return positionUsage[key] ? ['nhân sự đang sử dụng'] : []
  }

  // CRUD operations
  const handleCreate = () => {
    setModalType('create')
    setSelectedItem(null)
    if (activeTab === 'departments') {
      setFormData({
        department_code: '',
        department_name: '',
        description: '',
        department_type: 'department',
        parent_department_id: '',
        manager_id: '',
        is_active: true
      })
    } else {
      // Set "Đại Học Phenikaa" làm mặc định (giá trị đặc biệt "phenikaa")
      setFormData({
        position_code: '',
        position_name: '',
        description: '',
        level: 1,
        department_id: 'phenikaa',
        is_active: true
      })
    }
    setShowModal(true)
  }

  const handleEdit = (item) => {
    setModalType('edit')
    setSelectedItem(item)
    if (activeTab === 'departments') {
      setFormData({
        department_code: item.department_code || '',
        department_name: item.department_name || '',
        description: item.description || '',
        department_type: item.department_type || 'department',
        parent_department_id: item.parent_department_id || '',
        manager_id: item.manager_id || '',
        is_active: item.is_active !== undefined ? item.is_active : true
      })
    } else {
      // Nếu department_id là null hoặc không có, set thành "phenikaa"
      setFormData({
        position_code: item.position_code || '',
        position_name: item.position_name || '',
        description: item.description || '',
        level: item.level || 1,
        department_id: item.department_id ? String(item.department_id) : 'phenikaa',
        is_active: item.is_active !== undefined ? item.is_active : true
      })
    }
    setShowModal(true)
  }

  const handleDelete = async (item) => {
    if (activeTab === 'departments') {
      const issues = getDepartmentRelationIssues(item.id)
      if (issues.length > 0) {
        toast.error(`Không thể xóa đơn vị vì còn ${issues.join(', ')}.`)
        return
      }
    }

    if (activeTab === 'positions') {
      const issues = getPositionRelationIssues(item.id)
      if (issues.length > 0) {
        toast.error(`Không thể xóa chức vụ vì ${issues.join(', ')}.`)
        return
      }
    }

    const itemName = item.department_name || item.position_name
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${itemName}?`)) return

    try {
      if (activeTab === 'departments') {
        await departmentAPI.delete(item.id)
        toast.success('Xóa phòng ban thành công!')
      } else {
        await positionAPI.delete(item.id)
        toast.success('Xóa chức vụ thành công!')
      }
      await loadData()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (activeTab === 'departments') {
        if (modalType === 'create') {
          await departmentAPI.create(formData)
          toast.success('Tạo đơn vị mới thành công!')
        } else {
          await departmentAPI.update(selectedItem.id, formData)
          toast.success('Cập nhật đơn vị thành công!')
        }
        await loadData()
      } else {
        // Xử lý department_id: nếu là "phenikaa" thì gửi null, ngược lại convert sang number
        let submitData = { ...formData }
        if (submitData.department_id === 'phenikaa' || submitData.department_id === '') {
          submitData.department_id = null
        } else if (submitData.department_id) {
          submitData.department_id = parseInt(submitData.department_id)
        }
        
        if (modalType === 'create') {
          await positionAPI.create(submitData)
          toast.success('Tạo chức vụ thành công!')
        } else {
          await positionAPI.update(selectedItem.id, submitData)
          toast.success('Cập nhật chức vụ thành công!')
        }
        await loadData()
      }
      setShowModal(false)
    } catch (error) {
      console.error('Submit error:', error)
      toast.error(error.message)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Bảng hiển thị đơn vị
  const DepartmentTable = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {filteredDepartments.length === 0 ? (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
          <p className="text-gray-500">Chưa có đơn vị nào hoặc không có kết quả tìm kiếm.</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Mã đơn vị</th>
              <th className="table-header">Tên đơn vị</th>
              <th className="table-header">Loại đơn vị</th>
              <th className="table-header">Mô tả</th>
              <th className="table-header">Trạng thái</th>
              <th className="table-header">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDepartments.map((dept) => (
              <tr key={dept.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-blue-600">{dept.department_code}</td>
                <td className="table-cell">{dept.department_name}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dept.department_type === 'school' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {dept.department_type === 'school' ? 'Trường' : 'Phòng ban'}
                  </span>
                </td>
                <td className="table-cell max-w-xs truncate">{dept.description || 'Chưa có mô tả'}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    dept.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {dept.is_active ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEdit(dept)} 
                      className="text-blue-600 hover:text-blue-900"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(dept)} 
                      className="text-red-600 hover:text-red-900"
                      title="Xóa"
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
  )

  // Bảng hiển thị chức vụ
  const PositionTable = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      {filteredPositions.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
          <p className="text-gray-500">Chưa có chức vụ nào hoặc không có kết quả tìm kiếm.</p>
        </div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Mã chức vụ</th>
              <th className="table-header">Tên chức vụ</th>
              <th className="table-header">Đơn vị</th>
              <th className="table-header">Mô tả</th>
              <th className="table-header">Trạng thái</th>
              <th className="table-header">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPositions.map((pos) => (
              <tr key={pos.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium text-blue-600">{pos.position_code}</td>
                <td className="table-cell">{pos.position_name}</td>
                <td className="table-cell">{pos.Department?.department_name || 'Đại Học Phenikaa'}</td>
                <td className="table-cell max-w-xs truncate">{pos.description || 'Chưa có mô tả'}</td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    pos.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {pos.is_active ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEdit(pos)} 
                      className="text-blue-600 hover:text-blue-900"
                      title="Chỉnh sửa"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(pos)} 
                      className="text-red-600 hover:text-red-900"
                      title="Xóa"
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
  )

  const isFacultyTab = activeTab === 'faculties'

  const activeSearchTerm = isFacultyTab ? facultySearchTerm : searchTerm
  const searchPlaceholder = isFacultyTab ? 'Tìm kiếm theo mã, tên khoa, trưởng khoa...' : 'Tìm kiếm...'

  const departmentStatsCards = [
    {
      label: 'Tổng đơn vị',
      value: departments.length,
      icon: Building,
      color: 'bg-blue-500'
    },
    {
      label: 'Tổng chức vụ',
      value: positions.length,
      icon: Users,
      color: 'bg-green-500'
    }
  ]

  const facultyStatsCards = [
    { label: 'Tổng số khoa', value: facultyStats.total, icon: Building2, color: 'bg-blue-500' },
    { label: 'Đang hoạt động', value: facultyStats.active, icon: Users, color: 'bg-green-500' },
    { label: 'Ngừng hoạt động', value: facultyStats.inactive, icon: Users, color: 'bg-gray-500' },
    { label: 'Đã bổ nhiệm trưởng khoa', value: facultyStats.withDean, icon: Users, color: 'bg-indigo-500' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý cơ cấu tổ chức</h1>
          <p className="text-gray-600 mt-2">Quản lý đơn vị, khoa và chức vụ trong tổ chức</p>
        </div>
        {isFacultyTab ? null : (
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Thêm mới</span>
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(isFacultyTab ? facultyStatsCards : departmentStatsCards).map(({ label, value, icon: Icon, color }) => (
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('departments')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'departments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="w-5 h-5 inline mr-2" />
            Đơn vị ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('faculties')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'faculties'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="w-5 h-5 inline mr-2" />
            Khoa
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'positions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Chức vụ ({positions.length})
          </button>
        </nav>
      </div>

      {/* Search and Filter */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={activeSearchTerm}
              onChange={(e) => {
                const value = e.target.value
                if (isFacultyTab) {
                  setFacultySearchTerm(value)
                } else {
                  setSearchTerm(value)
                }
              }}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {activeTab === 'departments' && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả loại đơn vị</option>
              <option value="school">Trường</option>
              <option value="department">Phòng ban</option>
            </select>
          )}
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
            <Filter className="w-5 h-5" />
            <span>Bộ lọc</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {activeTab === 'departments' && <DepartmentTable />}
      {activeTab === 'positions' && <PositionTable />}
      {activeTab === 'faculties' && (
        <div className="bg-white shadow rounded-xl p-4">
          <FacultyManagement
            embedded
            showHeader={false}
            showStats={false}
            showSearch={false}
            searchTermOverride={facultySearchTerm}
            onStatsChange={setFacultyStats}
          />
        </div>
      )}

      {/* Modal */}
      {showModal && !isFacultyTab && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white my-8 flex flex-col max-h-[90vh]">
            <div className="mt-3 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {modalType === 'create' 
                  ? `Thêm ${activeTab === 'departments' ? 'đơn vị' : 'chức vụ'} mới`
                  : `Chỉnh sửa ${activeTab === 'departments' ? 'đơn vị' : 'chức vụ'}`}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã {activeTab === 'departments' ? 'đơn vị' : 'chức vụ'} *
                  </label>
                  <input
                    type="text"
                    value={activeTab === 'departments' ? formData.department_code || '' : formData.position_code || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      [activeTab === 'departments' ? 'department_code' : 'position_code']: e.target.value
                    })}
                    className="input-field"
                    required
                    placeholder="VD: IT, HR, DEV..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên {activeTab === 'departments' ? 'đơn vị' : 'chức vụ'} *
                  </label>
                  <input
                    type="text"
                    value={activeTab === 'departments' ? formData.department_name || '' : formData.position_name || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      [activeTab === 'departments' ? 'department_name' : 'position_name']: e.target.value
                    })}
                    className="input-field"
                    required
                    placeholder={`VD: ${activeTab === 'departments' ? 'Phòng Công nghệ thông tin' : 'Lập trình viên'}`}
                  />
                </div>

                {activeTab === 'departments' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loại đơn vị *
                    </label>
                    <select
                      value={formData.department_type || 'department'}
                      onChange={(e) => setFormData({...formData, department_type: e.target.value})}
                      className="input-field"
                      required
                    >
                      <option value="school">Trường</option>
                      <option value="department">Phòng ban</option>
                    </select>
                  </div>
                )}

                {activeTab === 'positions' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cấp độ *
                      </label>
                      <input
                        type="number"
                        value={formData.level || 1}
                        onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                        className="input-field"
                        min="1"
                        max="10"
                        required
                        placeholder="1-10"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Đơn vị
                      </label>
                      <select
                        value={formData.department_id || 'phenikaa'}
                        onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                        className="input-field"
                      >
                        <option value="phenikaa">Đại Học Phenikaa (Mặc định)</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={String(dept.id)}>{dept.department_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="input-field"
                    rows="3"
                    placeholder="Mô tả chi tiết..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={formData.is_active ? 'true' : 'false'}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === 'true'})}
                    className="input-field"
                  >
                    <option value="true">Hoạt động</option>
                    <option value="false">Không hoạt động</option>
                  </select>
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

export default DepartmentManagement