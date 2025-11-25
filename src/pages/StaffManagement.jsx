import React, { useEffect, useState } from "react"
import { Plus, Edit, Trash2, Search, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { userAPI, departmentAPI, positionAPI } from "@/services/api"
import toast from "react-hot-toast"

const STAFF_MANAGEMENT_POSITIONS = [
  "Trưởng phòng",
  "Phó phòng",
  "Chuyên viên chính",
  "Chuyên viên",
  "Nhân viên",
  "Thư ký",
  "Thực tập sinh"
]

const initialFormState = {
  user_id: "",
  full_name: "",
  gender: "Nam",
  position_id: "",
  organization_unit_id: "",
  email: "",
  phone: "",
  address: "",
  active: "Đang làm việc",
  hire_date: "",
  salary_coefficient: "",
  salary_level: "",
  management_positions: []
}

const StaffManagement = () => {
  const navigate = useNavigate()
  const [staffList, setStaffList] = useState([])
  const [departments, setDepartments] = useState([])
  const [positions, setPositions] = useState([])
  const [search, setSearch] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ ...initialFormState })

  // Load dữ liệu
  const loadData = async () => {
    try {
      const [staffRes, deptRes, posRes] = await Promise.all([
        userAPI.getAllByRole("staff"),
        departmentAPI.getAll(),
        positionAPI.getAll(),
      ])
      setStaffList(staffRes.data)
      setDepartments(deptRes.data)
      setPositions(posRes.data)
    } catch (err) {
      toast.error("Không tải được dữ liệu nhân viên hành chính")
    }
  }

  useEffect(() => { loadData() }, [])

  // Lọc chức vụ theo phòng ban đã chọn
  // Khi edit, nếu position_id đã có nhưng không thuộc phòng ban hiện tại, vẫn hiển thị position đó
  const filteredPositions = formData.organization_unit_id
    ? positions.filter((p) => {
        const deptId = p.department_id || p.Department?.id
        const isInDepartment = deptId === Number(formData.organization_unit_id)
        // Nếu đang edit và position này là position hiện tại, vẫn hiển thị
        const isCurrentPosition = editing && String(p.id) === String(formData.position_id)
        return isInDepartment || isCurrentPosition
      })
    : []

  const filteredStaff = staffList.filter((s) => {
    const matchSearch = s.full_name.toLowerCase().includes(search.toLowerCase())
    const matchGender = genderFilter === "all" || s.gender === genderFilter
    return matchSearch && matchGender
  })

  // Xử lý khi thay đổi phòng ban
  const handleDepartmentChange = (e) => {
    const newDeptId = e.target.value
    const currentPositionId = formData.position_id
    
    // Kiểm tra xem chức vụ hiện tại có thuộc phòng ban mới không
    if (currentPositionId && newDeptId) {
      const currentPosition = positions.find(p => String(p.id) === String(currentPositionId))
      const currentPositionDeptId = currentPosition?.department_id || currentPosition?.Department?.id
      
      // Nếu chức vụ hiện tại không thuộc phòng ban mới, reset chức vụ
      if (currentPositionDeptId !== Number(newDeptId)) {
        setFormData({ ...formData, organization_unit_id: newDeptId, position_id: "" })
      } else {
        setFormData({ ...formData, organization_unit_id: newDeptId })
      }
    } else {
      setFormData({ ...formData, organization_unit_id: newDeptId, position_id: "" })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        // Prevent sending empty strings for required FKs
        const payload = {
          ...formData,
          position_id: formData.position_id ? Number(formData.position_id) : undefined,
          organization_unit_id: formData.organization_unit_id ? Number(formData.organization_unit_id) : undefined,
          hire_date: formData.hire_date || undefined,
          salary_coefficient: formData.salary_coefficient ? Number(formData.salary_coefficient) : undefined,
          salary_level: formData.salary_level ? Number(formData.salary_level) : undefined,
          management_positions: (formData.management_positions || []).join(", ") || undefined
        }
        await userAPI.update(editing.id, payload)
        toast.success("Cập nhật nhân viên thành công")
      } else {
        await userAPI.create({
          ...formData,
          role: "staff",
          position_id: formData.position_id ? Number(formData.position_id) : undefined,
          organization_unit_id: formData.organization_unit_id ? Number(formData.organization_unit_id) : undefined,
          hire_date: formData.hire_date || undefined,
          salary_coefficient: formData.salary_coefficient ? Number(formData.salary_coefficient) : undefined,
          salary_level: formData.salary_level ? Number(formData.salary_level) : undefined,
          management_positions: (formData.management_positions || []).join(", ") || undefined,
        })
        toast.success("Thêm nhân viên hành chính thành công")
      }
      setShowModal(false)
      setFormData({ ...initialFormState })
      await loadData()
    } catch {
      toast.error("Lỗi khi lưu dữ liệu")
    }
  }

  const handleDelete = async (staff) => {
    if (window.confirm(`Xóa nhân viên ${staff.full_name}?`)) {
      try {
        await userAPI.delete(staff.id)
        toast.success("Đã xóa nhân viên")
        await loadData()
      } catch {
        toast.error("Lỗi khi xóa nhân viên")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý nhân viên hành chính</h1>
        <button
          onClick={() => {
            setEditing(null)
            setFormData({ ...initialFormState })
            setShowModal(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm nhân viên</span>
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          className="border rounded-md px-3 py-1"
          placeholder="Tìm nhân viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-md px-3 py-1"
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
        >
          <option value="all">Tất cả giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
      </div>

      {/* Table */}
      <table className="min-w-full bg-white border">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-header">Mã NV</th>
            <th className="table-header">Họ tên</th>
            <th className="table-header">Chức vụ</th>
            <th className="table-header">Chức vụ quản lý</th>
            <th className="table-header">Phòng ban</th>
            <th className="table-header">Email</th>
            <th className="table-header">Số điện thoại</th>
            <th className="table-header">Trạng thái</th>
            <th className="table-header">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredStaff.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="table-cell">{s.user_id}</td>
              <td className="table-cell">{s.full_name}</td>
              <td className="table-cell">{s.position}</td>
              <td className="table-cell">
                {Array.isArray(s.management_positions) && s.management_positions.length > 0
                  ? s.management_positions.join(", ")
                  : (s.management_positions
                      ? String(s.management_positions)
                      : <span className="text-gray-400">Không có</span>)}
              </td>
              <td className="table-cell">{s.OrganizationUnit?.name || "Đại Học Phenikaa"}</td>
              <td className="table-cell">{s.email}</td>
              <td className="table-cell">{s.phone}</td>
              <td className="table-cell">{s.active}</td>
              <td className="table-cell">
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/nhan-vien/${s.id}`)}
                    className="text-green-600 hover:text-green-900"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(s)
                      const mgmtPosArr = Array.isArray(s.management_positions)
                        ? s.management_positions
                        : (s.management_positions ? String(s.management_positions).split(",").map(pos => pos.trim()).filter(Boolean) : [])

                      setFormData({
                        user_id: s.user_id ?? "",
                        full_name: s.full_name ?? "",
                        gender: s.gender ?? "Nam",
                        position_id: s.position_id ? String(s.position_id) : "",
                        organization_unit_id: s.organization_unit_id ? String(s.organization_unit_id) : "",
                        email: s.email ?? "",
                        phone: s.phone ?? "",
                        address: s.address ?? "",
                        active: s.active ?? "Đang làm việc",
                        hire_date: s.hire_date ? new Date(s.hire_date).toISOString().split('T')[0] : "",
                        salary_coefficient: s.salary_coefficient ?? "",
                        salary_level: s.salary_level ?? "",
                        management_positions: mgmtPosArr
                      })
                      setShowModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(s)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-start justify-center py-10 px-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xl my-8 flex flex-col max-h-[90vh]">
              <div className="p-6 pb-4">
                <h2 className="text-lg font-bold mb-4">
                  {editing ? "Cập nhật nhân viên hành chính" : "Thêm nhân viên hành chính"}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="px-6 overflow-y-auto flex-1 space-y-3">
              <input
                type="text"
                className="input-field"
                placeholder="Mã nhân viên"
                value={formData.user_id ?? ""}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                required
              />
              <input
                type="text"
                className="input-field"
                placeholder="Họ tên"
                value={formData.full_name ?? ""}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
              <select
                value={formData.gender ?? "Nam"}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="input-field"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
              <select
                value={formData.organization_unit_id ?? ""}
                onChange={handleDepartmentChange}
                className="input-field"
                required
              >
                <option value="">Chọn phòng ban</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.department_name}
                  </option>
                ))}
              </select>
              <select
                className="input-field"
                value={formData.position_id ?? ""}
                onChange={(e) => setFormData({ ...formData, position_id: e.target.value })}
                disabled={!formData.organization_unit_id}
                required
              >
                <option value="">
                  {formData.organization_unit_id ? "Chọn chức vụ" : "Vui lòng chọn phòng ban trước"}
                </option>
                {filteredPositions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.position_name}
                  </option>
                ))}
              </select>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Chức vụ quản lý</label>
                <div className="flex flex-wrap gap-3">
                  {STAFF_MANAGEMENT_POSITIONS.map((pos) => (
                    <label key={pos} className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={formData.management_positions?.includes(pos)}
                        onChange={(e) => {
                          setFormData((prev) => {
                            const set = new Set(prev.management_positions || [])
                            if (e.target.checked) {
                              set.add(pos)
                            } else {
                              set.delete(pos)
                            }
                            return { ...prev, management_positions: Array.from(set) }
                          })
                        }}
                      />
                      <span>{pos}</span>
                    </label>
                  ))}
                </div>
              </div>
              <input
                type="email"
                className="input-field"
                placeholder="Email"
                value={formData.email ?? ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <input
                type="tel"
                className="input-field"
                placeholder="Số điện thoại"
                value={formData.phone ?? ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <textarea
                className="input-field"
                placeholder="Địa chỉ"
                value={formData.address ?? ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows="2"
              />
              <select
                value={formData.active ?? "Đang làm việc"}
                onChange={(e) => setFormData({ ...formData, active: e.target.value })}
                className="input-field"
              >
                <option value="Đang làm việc">Đang làm việc</option>
                <option value="Nghỉ việc">Nghỉ việc</option>
              </select>
                </div>
                <div className="flex justify-end space-x-3 p-6 pt-4 border-t bg-white">
                  <button
                    onClick={() => setShowModal(false)}
                    type="button"
                    className="btn-secondary"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    {editing ? "Lưu thay đổi" : "Thêm mới"}
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

export default StaffManagement
