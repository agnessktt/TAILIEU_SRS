import React, { useEffect, useMemo, useState } from "react"
import { Plus, Edit, Trash2, Search, Eye } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { userAPI, departmentAPI, facultyAPI } from "@/services/api"
import toast from "react-hot-toast"

const DEGREE_OPTIONS = ["Giáo sư", "Phó giáo sư", "Tiến sĩ", "Thạc sĩ"]
const MANAGEMENT_POSITIONS = [
  "Không có",
  "Trưởng khoa",
  "Phó trưởng khoa",
  "Trưởng bộ môn",
  "Phó trưởng bộ môn",
  "Trưởng phòng",
  "Phó trưởng phòng",
  "Hiệu trưởng",
  "Phó hiệu trưởng",
  "Chủ nhiệm chương trình",
  "Cố vấn học tập"
]

const initialFormState = {
  user_id: "",
  full_name: "",
  gender: "Nam",
  degrees: [],
  organization_unit_id: "",
  faculty_id: "",
  management_positions: [],
  email: "",
  phone: "",
  address: "",
  active: "Đang làm việc",
  hire_date: "",
  salary_coefficient: "",
  salary_level: "",
}

const LecturerManagement = () => {
  const navigate = useNavigate()
  const [lecturers, setLecturers] = useState([])
  const [departments, setDepartments] = useState([])
  const [faculties, setFaculties] = useState([])
  const [search, setSearch] = useState("")
  const [genderFilter, setGenderFilter] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ ...initialFormState })

  const loadData = async () => {
    try {
      const [lectRes, deptRes, facultyRes] = await Promise.all([
        userAPI.getAllByRole("lecturer"),
        departmentAPI.getAll(),
        facultyAPI.getAll(),
      ])
      setLecturers(lectRes.data)
      setDepartments(deptRes.data)
      setFaculties(facultyRes.data)
    } catch (err) {
      toast.error("Không tải được dữ liệu")
    }
  }

  useEffect(() => { loadData() }, [])

  const schoolDepartments = useMemo(
    () => departments.filter((dept) => dept.department_type === "school"),
    [departments]
  )

  // Lọc khoa theo đơn vị đã chọn
  // Nếu không chọn đơn vị (mặc định Đại Học Phenikaa) thì hiển thị tất cả khoa
  // Khi edit, nếu khoa hiện tại không thuộc đơn vị đã chọn, vẫn hiển thị khoa đó
  const filteredFaculties = !formData.organization_unit_id
    ? faculties
    : faculties.filter((f) => {
        const facultyDeptId = f.department_id || f.Department?.id
        const isInDepartment = facultyDeptId === Number(formData.organization_unit_id)
        // Nếu đang edit và khoa này là khoa hiện tại, vẫn hiển thị
        const isCurrentFaculty = editing && String(f.id) === String(formData.faculty_id)
        return isInDepartment || isCurrentFaculty
      })

  const filteredLecturers = lecturers.filter(l => {
    const matchSearch = l.full_name.toLowerCase().includes(search.toLowerCase())
    const matchGender = genderFilter === "all" || l.gender === genderFilter
    return matchSearch && matchGender
  })

  // Xử lý khi thay đổi đơn vị
  const handleOrganizationUnitChange = (e) => {
    const newOrgUnitId = e.target.value
    const currentFacultyId = formData.faculty_id
    
    // Nếu đang chọn khoa, kiểm tra xem khoa đó có thuộc đơn vị mới không
    if (currentFacultyId && newOrgUnitId) {
      const currentFaculty = faculties.find(f => String(f.id) === String(currentFacultyId))
      const currentFacultyDeptId = currentFaculty?.department_id || currentFaculty?.Department?.id
      
      // Nếu khoa hiện tại không thuộc đơn vị mới, reset khoa
      if (currentFacultyDeptId !== Number(newOrgUnitId)) {
        setFormData({ ...formData, organization_unit_id: newOrgUnitId, faculty_id: "" })
      } else {
        setFormData({ ...formData, organization_unit_id: newOrgUnitId })
      }
    } else {
      setFormData({ ...formData, organization_unit_id: newOrgUnitId })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const degreeString = (formData.degrees || []).join(', ');
      const managementPositionsString = (formData.management_positions || [])
        .filter(pos => pos !== "Không có")
        .join(', ');
      
      // Xử lý organization_unit_id: nếu để trống (Đại Học Phenikaa) thì gửi null
      const orgUnitId = formData.organization_unit_id
        ? Number(formData.organization_unit_id)
        : null
      
      const payload = {
        user_id: formData.user_id,
        full_name: formData.full_name,
        degree: degreeString,
        gender: formData.gender,
        organization_unit_id: orgUnitId,
        faculty_id: formData.faculty_id ? Number(formData.faculty_id) : undefined,
        management_positions: managementPositionsString || undefined,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        active: formData.active,
        hire_date: formData.hire_date || undefined,
        salary_coefficient: formData.salary_coefficient ? Number(formData.salary_coefficient) : undefined,
        salary_level: formData.salary_level ? Number(formData.salary_level) : undefined,
      }
      if (editing) {
        await userAPI.update(editing.id, payload)
        toast.success("Cập nhật giảng viên thành công")
      } else {
        await userAPI.create({ ...payload, role: "lecturer" })
        toast.success("Thêm giảng viên thành công")
      }
      setShowModal(false)
      setFormData({ 
        ...initialFormState,
        organization_unit_id: "" // Reset về mặc định (Đại Học Phenikaa)
      })
      await loadData()
    } catch {
      toast.error("Lỗi lưu dữ liệu")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý giảng viên</h1>
        <button
          onClick={() => {
            setEditing(null)
            // Đơn vị mặc định là "Đại Học Phenikaa" (khi để trống)
            setFormData({ 
              ...initialFormState,
              organization_unit_id: "" // Mặc định Đại Học Phenikaa
            })
            setShowModal(true)
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm giảng viên</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          className="border rounded-md px-3 py-1"
          placeholder="Tìm giảng viên..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="border rounded-md px-3 py-1"
          value={genderFilter}
          onChange={e => setGenderFilter(e.target.value)}
        >
          <option value="all">Tất cả giới tính</option>
          <option value="Nam">Nam</option>
          <option value="Nữ">Nữ</option>
        </select>
      </div>

      <table className="min-w-full bg-white border">
        <thead className="bg-gray-50">
          <tr>
            <th className="table-header">Mã GV</th>
            <th className="table-header">Họ tên</th>
            <th className="table-header">Khoa công tác</th>
            <th className="table-header">Chức vụ quản lý</th>
            <th className="table-header">Trạng thái</th>
            <th className="table-header">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {filteredLecturers.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="table-cell">{l.user_id}</td>
              <td className="table-cell">{l.full_name}</td>
              <td className="table-cell">{l.Faculty?.faculty_name || <span className="text-gray-400">-</span>}</td>
              <td className="table-cell">
                {Array.isArray(l.management_positions) && l.management_positions.length > 0
                  ? l.management_positions.join(", ")
                  : (l.management_positions ? String(l.management_positions) : <span className="text-gray-400">Không có</span>)}
              </td>
              <td className="table-cell">{l.active}</td>
              <td className="table-cell">
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(`/giang-vien/${l.id}`)}
                    className="text-green-600 hover:text-green-900"
                    title="Xem chi tiết"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const degArr = Array.isArray(l.degrees)
                        ? l.degrees
                        : (l.degree ? String(l.degree).split(',').map(s => s.trim()) : [])
                      const mgmtPosArr = Array.isArray(l.management_positions)
                        ? l.management_positions
                        : (l.management_positions ? String(l.management_positions).split(',').map(s => s.trim()).filter(Boolean) : [])
                      
                      setEditing(l)
                      // Nếu organization_unit_id là null hoặc không thuộc loại trường, xem như Đại Học Phenikaa
                      const orgUnitId = l.organization_unit_id 
                        ? (schoolDepartments.find(d => d.id === l.organization_unit_id) 
                            ? String(l.organization_unit_id) 
                            : "")
                        : ""
                      
                      setFormData({
                        user_id: l.user_id ?? "",
                        full_name: l.full_name ?? "",
                        gender: l.gender ?? "Nam",
                        degrees: degArr,
                        organization_unit_id: orgUnitId,
                        faculty_id: l.faculty_id ? String(l.faculty_id) : "",
                        management_positions: mgmtPosArr.length > 0 ? mgmtPosArr : [],
                        email: l.email ?? "",
                        phone: l.phone ?? "",
                        address: l.address ?? "",
                        active: l.active ?? "Đang làm việc",
                        hire_date: l.hire_date ? l.hire_date.split('T')[0] : "",
                        salary_coefficient: l.salary_coefficient ? String(l.salary_coefficient) : "",
                        salary_level: l.salary_level ? String(l.salary_level) : "",
                      })
                      setShowModal(true)
                    }}
                    className="text-blue-600 hover:text-blue-900"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm("Xóa giảng viên này?")) {
                        await userAPI.delete(l.id)
                        await loadData()
                        toast.success("Đã xóa")
                      }
                    }}
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

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto z-50">
          <div className="min-h-screen flex items-start justify-center py-10 px-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-xl my-8 flex flex-col max-h-[90vh]">
              <div className="p-6 pb-4">
                <h2 className="text-lg font-bold mb-4">
                  {editing ? "Cập nhật giảng viên" : "Thêm giảng viên"}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="px-6 overflow-y-auto flex-1 space-y-3">
              <input
                type="text"
                className="input-field"
                placeholder="Mã giảng viên"
                value={formData.user_id ?? ""}
                onChange={e => setFormData({ ...formData, user_id: e.target.value })}
                required
              />
              <input
                type="text"
                className="input-field"
                placeholder="Họ tên"
                value={formData.full_name ?? ""}
                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
              <select
                value={formData.gender ?? "Nam"}
                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                className="input-field"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </select>
              <div>
                <label className="block mb-1">Học vị</label>
                <div className="flex flex-wrap gap-3">
                  {DEGREE_OPTIONS.map(opt => (
                    <label key={opt} className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={formData.degrees?.includes(opt)}
                        onChange={(e) => {
                          setFormData(prev => {
                            const set = new Set(prev.degrees || [])
                            if (e.target.checked) {
                              set.add(opt)
                            } else {
                              set.delete(opt)
                            }
                            return { ...prev, degrees: Array.from(set) }
                          })
                        }}
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Đơn vị *</label>
                <select
                  value={formData.organization_unit_id ?? ""}
                  onChange={handleOrganizationUnitChange}
                  className="input-field"
                >
                  <option value="">Đại Học Phenikaa (Mặc định)</option>
                  {schoolDepartments.map(d => (
                    <option key={d.id} value={d.id}>{d.department_name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Mặc định: Đại Học Phenikaa. Bạn có thể chọn đơn vị khác nếu giảng viên thuộc về đơn vị đó.
                </p>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Khoa công tác</label>
                <select
                  value={formData.faculty_id ?? ""}
                  onChange={e => setFormData({ ...formData, faculty_id: e.target.value })}
                  className="input-field"
                >
                  <option value="">
                    {formData.organization_unit_id 
                      ? "Chọn khoa công tác" 
                      : "Chọn khoa công tác (tất cả khoa)"}
                  </option>
                  {filteredFaculties.map(f => (
                    <option key={f.id} value={f.id}>{f.faculty_code} - {f.faculty_name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {!formData.organization_unit_id
                    ? "Đã chọn Đại Học Phenikaa: có thể chọn bất kỳ khoa nào"
                    : `Chỉ hiển thị khoa thuộc đơn vị đã chọn (${schoolDepartments.find(d => d.id === Number(formData.organization_unit_id))?.department_name || ""})`}
                </p>
              </div>
              <div>
                <label className="block mb-1">Chức vụ quản lý</label>
                <div className="flex flex-wrap gap-3">
                  {MANAGEMENT_POSITIONS.map(pos => (
                    <label key={pos} className="inline-flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={formData.management_positions?.includes(pos)}
                        onChange={(e) => {
                          setFormData(prev => {
                            const set = new Set(prev.management_positions || [])
                            if (e.target.checked) {
                              // Nếu chọn "Không có", xóa tất cả các lựa chọn khác
                              if (pos === "Không có") {
                                return { ...prev, management_positions: ["Không có"] }
                              }
                              // Nếu chọn một chức vụ khác, bỏ "Không có"
                              set.delete("Không có")
                              set.add(pos)
                            } else {
                              set.delete(pos)
                              // Nếu không còn chức vụ nào, tự động thêm "Không có"
                              if (set.size === 0) {
                                set.add("Không có")
                              }
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
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <input
                type="tel"
                className="input-field"
                placeholder="Số điện thoại"
                value={formData.phone ?? ""}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Địa chỉ"
                value={formData.address ?? ""}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
              <select
                value={formData.active ?? "Đang làm việc"}
                onChange={e => setFormData({ ...formData, active: e.target.value })}
                className="input-field"
              >
                <option value="Đang làm việc">Đang làm việc</option>
                <option value="Nghỉ việc">Nghỉ việc</option>
              </select>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Ngày vào làm</label>
                  <input
                    type="date"
                    className="input-field"
                    value={formData.hire_date ?? ""}
                    onChange={e => setFormData({ ...formData, hire_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Hệ số lương</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input-field"
                    placeholder="Nhập hệ số lương"
                    value={formData.salary_coefficient ?? ""}
                    onChange={e => setFormData({ ...formData, salary_coefficient: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Bậc lương</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    placeholder="Nhập bậc lương"
                    value={formData.salary_level ?? ""}
                    onChange={e => setFormData({ ...formData, salary_level: e.target.value })}
                  />
                </div>
              </div>
                </div>
                <div className="flex justify-end space-x-3 p-6 pt-4 border-t bg-white">
                  <button onClick={() => setShowModal(false)} type="button" className="btn-secondary">Hủy</button>
                  <button type="submit" className="btn-primary">
                    {editing ? "Lưu" : "Thêm"}
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

export default LecturerManagement
