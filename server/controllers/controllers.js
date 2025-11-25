// server/controllers/controllers.js - Consolidated controllers
import sequelize from "../config/database.js";
import { Op } from "sequelize";
import {
  Cohort,
  Program,
  ProgramTuitionYear,
  Employee,
  Course,
  CourseCategory,
  Department,
  KnowledgeBlock,
  Major,
  CurriculumStructure,
  Position,
  Enrollment,
  Faculty,
  ProgramCourse
} from "../models/index.js";
import { handleError, safeCount } from "../utils/errorHandler.js";
import { recalculateProgramTotalCredits } from "../utils/database.js";
// ===================== Departments =====================
// Debug: Check if models are loaded
console.log("[DEBUG] DepartmentsController loaded");
console.log("[DEBUG] Department model:", Department ? "loaded" : "NOT loaded");
console.log("[DEBUG] Employee model:", Employee ? "loaded" : "NOT loaded");

export const getAllDepartments = async (req, res, next) => {
  try {
    console.log("[DEBUG] getAllDepartments called");
    const departments = await Department.findAll({
      order: [['created_at', 'DESC']]
    });
    console.log(`[DEBUG] Found ${departments.length} departments`);
    res.json(departments);
  } catch (error) {
    console.error("[ERROR] getAllDepartments failed:", error);
    handleError(res, error, "Không thể tải danh sách phòng ban");
  }
};

export const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Không tìm thấy phòng ban" });
    }
    res.json(department);
  } catch (error) {
    handleError(res, error, "Không thể tải thông tin phòng ban");
  }
};

export const createDepartment = async (req, res) => {
  try {
    const { department_code, department_name, description, department_type, parent_department_id, manager_id, is_active = true } = req.body;

    if (!department_code || !department_name) {
      return res.status(400).json({
        error: "Mã phòng ban và tên phòng ban là bắt buộc"
      });
    }

    const cleanParentDepartmentId = parent_department_id === '' ? null : parent_department_id;
    const cleanManagerId = manager_id === '' ? null : manager_id;
    const cleanDepartmentType = department_type || 'department';

    const department = await Department.create({
      department_code,
      department_name,
      description,
      department_type: cleanDepartmentType,
      parent_department_id: cleanParentDepartmentId,
      manager_id: cleanManagerId,
      is_active
    });

    res.status(201).json(department);
  } catch (error) {
    handleError(res, error, "Không thể thêm phòng ban");
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Không tìm thấy phòng ban" });
    }

    const updateData = { ...req.body };
    if (updateData.parent_department_id === '') {
      updateData.parent_department_id = null;
    }
    if (updateData.manager_id === '') {
      updateData.manager_id = null;
    }

    await department.update(updateData);
    res.json(department);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật phòng ban");
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Không tìm thấy phòng ban" });
    }

    const [employeeCount, facultyCount, positionCount, childCount] = await Promise.all([
      Employee.count({ where: { department_id: req.params.id } }),
      Faculty.count({ where: { department_id: req.params.id } }),
      Position.count({ where: { department_id: req.params.id } }),
      Department.count({ where: { parent_department_id: req.params.id } })
    ]);

    if (employeeCount > 0) {
      return res.status(400).json({
        error: "Không thể xóa phòng ban vì đang có nhân sự trực thuộc"
      });
    }

    if (positionCount > 0) {
      return res.status(400).json({
        error: "Không thể xóa phòng ban vì đang có chức vụ trực thuộc"
      });
    }

    if (facultyCount > 0) {
      return res.status(400).json({
        error: "Không thể xóa phòng ban vì đang có khoa trực thuộc"
      });
    }

    if (childCount > 0) {
      return res.status(400).json({
        error: "Không thể xóa phòng ban vì đang có đơn vị con"
      });
    }

    await department.destroy();
    res.json({ message: "Xóa phòng ban thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa phòng ban");
  }
};

const parseDepartmentList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string" && item.trim() !== "").map((item) => item.trim());
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string" && item.trim() !== "").map((item) => item.trim());
    }
  } catch (error) {
    // Fall back to comma separated values
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const serializeDepartmentList = (value) => {
  const list = parseDepartmentList(value);
  return list.length ? JSON.stringify(list) : null;
};

const normalizeMajorIds = (value) => {
  if (!value) return [];
  if (!Array.isArray(value)) return [];
  const ids = value
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  return [...new Set(ids)];
};

const syncFacultyMajors = async (facultyId, majorIds = []) => {
  const ids = normalizeMajorIds(majorIds);
  const resetCondition = { faculty_id: facultyId };
  if (ids.length) {
    resetCondition.id = { [Op.notIn]: ids };
  }
  await Major.update({ faculty_id: null }, { where: resetCondition });
  if (ids.length) {
    await Major.update({ faculty_id: facultyId }, { where: { id: ids } });
  }
  return ids;
};

const updateFacultyDepartmentListSnapshot = async (faculty, majorIds) => {
  const ids = normalizeMajorIds(majorIds);
  if (!ids.length) {
    await faculty.update({ department_list: null });
    return;
  }
  const majors = await Major.findAll({
    where: { id: ids },
    attributes: ["major_name"]
  });
  const names = majors.map((major) => major.major_name).filter(Boolean);
  await faculty.update({ department_list: names.length ? serializeDepartmentList(names) : null });
};

// Helper function để đồng bộ trưởng khoa từ Employee (khi cập nhật chức vụ quản lý)
const syncDeanFromEmployee = async (employeeId, facultyId, managementPositions) => {
  if (!employeeId || !facultyId) return;
  
  const positions = managementPositions 
    ? String(managementPositions).split(',').map(s => s.trim()).filter(Boolean)
    : [];
  
  const isDean = positions.includes('Trưởng khoa') || positions.includes('Phó trưởng khoa');
  
  if (isDean) {
    // Tìm khoa hiện tại mà employee này đang là trưởng khoa
    const currentDeanFaculties = await Faculty.findAll({
      where: { dean_id: employeeId }
    });
    
    // Bỏ trưởng khoa của các khoa khác
    for (const faculty of currentDeanFaculties) {
      if (faculty.id !== facultyId) {
        await faculty.update({ dean_id: null });
      }
    }
    
    // Cập nhật trưởng khoa cho khoa mới
    const faculty = await Faculty.findByPk(facultyId);
    if (faculty) {
      await faculty.update({ dean_id: employeeId });
    }
  } else {
    // Nếu không còn là trưởng khoa, bỏ dean_id của tất cả khoa
    await Faculty.update(
      { dean_id: null },
      { where: { dean_id: employeeId } }
    );
  }
};

// Helper function để đồng bộ chức vụ quản lý từ Faculty (khi cập nhật dean_id)
const syncManagementPositionsFromFaculty = async (facultyId, deanId) => {
  if (!facultyId) return;
  
  const faculty = await Faculty.findByPk(facultyId);
  if (!faculty) return;
  
  // Nếu có dean_id mới
  if (deanId) {
    // Tìm các khoa khác mà employee này đang là trưởng khoa
    const otherFaculties = await Faculty.findAll({
      where: { 
        dean_id: deanId,
        id: { [Op.ne]: facultyId }
      }
    });
    
    // Bỏ trưởng khoa của các khoa khác
    for (const otherFaculty of otherFaculties) {
      await otherFaculty.update({ dean_id: null });
    }
    
    // Cập nhật management_positions cho employee
    const employee = await Employee.findByPk(deanId);
    if (employee) {
      const currentPositions = employee.management_positions
        ? String(employee.management_positions).split(',').map(s => s.trim()).filter(Boolean)
        : [];
      
      // Thêm "Trưởng khoa" nếu chưa có
      if (!currentPositions.includes('Trưởng khoa') && !currentPositions.includes('Phó trưởng khoa')) {
        currentPositions.push('Trưởng khoa');
        // Bỏ "Không có" nếu có
        const filtered = currentPositions.filter(p => p !== 'Không có');
        await employee.update({ 
          management_positions: filtered.join(', '),
          faculty_id: facultyId 
        });
      } else {
        // Đảm bảo faculty_id được cập nhật
        await employee.update({ faculty_id: facultyId });
      }
    }
  } else {
    // Nếu bỏ trưởng khoa, tìm employee cũ và cập nhật
    const oldDeanId = faculty.dean_id;
    if (oldDeanId) {
      const oldEmployee = await Employee.findByPk(oldDeanId);
      if (oldEmployee) {
        const currentPositions = oldEmployee.management_positions
          ? String(oldEmployee.management_positions).split(',').map(s => s.trim()).filter(Boolean)
          : [];
        
        // Bỏ "Trưởng khoa" và "Phó trưởng khoa" khỏi management_positions
        const filtered = currentPositions.filter(p => 
          p !== 'Trưởng khoa' && p !== 'Phó trưởng khoa'
        );
        
        // Nếu không còn chức vụ nào, thêm "Không có"
        const finalPositions = filtered.length > 0 ? filtered : ['Không có'];
        await oldEmployee.update({ 
          management_positions: finalPositions.join(', ')
        });
      }
    }
  }
};

const facultyIncludeConfig = [
  {
    model: Employee,
    as: "Dean",
    attributes: ["id", "first_name", "last_name", "email"]
  },
  {
    model: Major,
    as: "Majors",
    attributes: ["id", "major_name"]
  },
  {
    model: Department,
    as: "Department",
    attributes: ["id", "department_name", "department_code"]
  }
];

const formatFacultyResponse = (facultyInstance) => {
  const data = facultyInstance.toJSON();
  const majors = data.Majors || [];
  const majorNames = majors.map((major) => major.major_name).filter(Boolean);
  data.department_list = majorNames.length ? majorNames : parseDepartmentList(data.department_list);
  data.major_ids = majors.length ? majors.map((major) => major.id) : normalizeMajorIds(data.major_ids);
  if (data.Dean) {
    data.dean_name = `${data.Dean.first_name || ""} ${data.Dean.last_name || ""}`.trim();
  }
  // Giữ lại Department trong response để frontend có thể sử dụng
  // data.Department sẽ chứa thông tin đơn vị trực thuộc
  delete data.Majors;
  return data;
};

const currentYear = () => new Date().getFullYear();

const normalizeStartYear = (value) => {
  const year = Number(value);
  if (!Number.isInteger(year)) return currentYear();
  return Math.min(Math.max(year, 2000), currentYear());
};

const buildTuitionYearWindow = (startYear) => {
  const normalized = normalizeStartYear(startYear);
  const years = [];
  for (let i = 0; i < 5; i++) {
    const year = normalized - i;
    if (year >= 2000) {
      years.push(year);
    }
  }
  return years;
};

const ensureProgramTuitionYears = async (program, startYear, tuitionPayload = []) => {
  const years = buildTuitionYearWindow(startYear);
  if (!years.length) return [];

  const existing = await ProgramTuitionYear.findAll({
    where: { program_id: program.id, year: years }
  });

  const existingMap = new Map(existing.map((row) => [row.year, row]));

  for (const year of years) {
    if (!existingMap.has(year)) {
      const created = await ProgramTuitionYear.create({
        program_id: program.id,
        year,
        total_credits: 0,
        tuition_paid: 0,
        tuition_remaining: 0,
        program_count: 1
      });
      existingMap.set(year, created);
    }
  }

  if (Array.isArray(tuitionPayload)) {
    for (const item of tuitionPayload) {
      if (!item || typeof item.year === "undefined") continue;
      const year = Number(item.year);
      if (!years.includes(year)) continue;
      const record = existingMap.get(year);
      if (!record) continue;
      await record.update({
        total_credits: Number.isFinite(Number(item.total_credits)) ? Number(item.total_credits) : record.total_credits,
        tuition_paid: Number.isFinite(Number(item.tuition_paid)) ? Number(item.tuition_paid) : record.tuition_paid,
        tuition_remaining: Number.isFinite(Number(item.tuition_remaining)) ? Number(item.tuition_remaining) : record.tuition_remaining,
        program_count: Number.isInteger(Number(item.program_count)) ? Number(item.program_count) : record.program_count
      });
    }
  }

  return ProgramTuitionYear.findAll({
    where: { program_id: program.id, year: years },
    order: [["year", "DESC"]]
  });
};

// ===================== Faculties =====================
export const getAllFaculties = async (req, res) => {
  try {
    const faculties = await Faculty.findAll({
      include: facultyIncludeConfig,
      order: [['created_at', 'DESC']]
    });
    res.json(faculties.map(formatFacultyResponse));
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách khoa");
  }
};

export const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id, {
      include: facultyIncludeConfig
    });
    if (!faculty) {
      return res.status(404).json({ error: "Không tìm thấy khoa" });
    }
    res.json(formatFacultyResponse(faculty));
  } catch (error) {
    handleError(res, error, "Không thể tải thông tin khoa");
  }
};

export const createFaculty = async (req, res) => {
  try {
    const {
      faculty_code,
      faculty_name,
      description,
      is_active = true,
      established_date,
      dean_id,
      contact_email,
      contact_phone,
      department_id,
      major_ids = []
    } = req.body;
    if (!faculty_code || !faculty_name) {
      return res.status(400).json({ error: "Mã khoa và tên khoa là bắt buộc" });
    }

    // Xử lý department_id: nếu là 0, empty string, hoặc undefined thì set null
    const cleanDepartmentId = department_id && department_id !== '' && department_id !== 0 
      ? Number(department_id) 
      : null;

    const faculty = await Faculty.create({
      faculty_code,
      faculty_name,
      description: description || null,
      is_active,
      established_date: established_date === "" ? null : established_date,
      dean_id: dean_id || null,
      contact_email: contact_email || null,
      contact_phone: contact_phone || null,
      department_id: cleanDepartmentId,
      department_list: null
    });

    const assignedMajorIds = await syncFacultyMajors(faculty.id, major_ids);
    await updateFacultyDepartmentListSnapshot(faculty, assignedMajorIds);

    // Đồng bộ management_positions khi tạo faculty với dean_id
    if (dean_id) {
      await syncManagementPositionsFromFaculty(faculty.id, dean_id);
    }

    const created = await Faculty.findByPk(faculty.id, {
      include: facultyIncludeConfig
    });

    res.status(201).json(formatFacultyResponse(created));
  } catch (error) {
    handleError(res, error, "Không thể thêm khoa");
  }
};

export const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: "Không tìm thấy khoa" });
    }

    const { major_ids } = req.body;
    const updateData = { ...req.body };
    delete updateData.major_ids;
    if (updateData.description === '') {
      updateData.description = null;
    }
    if (updateData.established_date === '') {
      updateData.established_date = null;
    }
    if (updateData.contact_email === '') {
      updateData.contact_email = null;
    }
    if (updateData.contact_phone === '') {
      updateData.contact_phone = null;
    }
    // Xử lý department_id: nếu là 0, empty string, hoặc undefined thì set null, ngược lại convert sang number
    if (updateData.department_id !== undefined) {
      updateData.department_id = (updateData.department_id && updateData.department_id !== '' && updateData.department_id !== 0)
        ? Number(updateData.department_id)
        : null;
    }

    // Lưu dean_id cũ trước khi cập nhật
    const oldDeanId = faculty.dean_id;
    const newDeanId = updateData.dean_id !== undefined ? (updateData.dean_id || null) : oldDeanId;

    await faculty.update(updateData);

    // Đồng bộ management_positions khi thay đổi dean_id
    if (updateData.dean_id !== undefined && newDeanId !== oldDeanId) {
      await syncManagementPositionsFromFaculty(faculty.id, newDeanId);
    }

    if (Array.isArray(major_ids)) {
      const assignedMajorIds = await syncFacultyMajors(faculty.id, major_ids);
      await updateFacultyDepartmentListSnapshot(faculty, assignedMajorIds);
    }

    const updated = await Faculty.findByPk(req.params.id, {
      include: facultyIncludeConfig
    });

    res.json(formatFacultyResponse(updated));
  } catch (error) {
    handleError(res, error, "Không thể cập nhật khoa");
  }
};

export const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByPk(req.params.id);
    if (!faculty) {
      return res.status(404).json({ error: "Không tìm thấy khoa" });
    }

    await Major.update({ faculty_id: null }, { where: { faculty_id: faculty.id } });
    await faculty.destroy();
    res.json({ message: "Xóa khoa thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa khoa");
  }
};

// ===================== Majors =====================
export const getAllMajors = async (req, res) => {
  try {
    const majors = await Major.findAll({
      include: [
        {
          model: Department,
          as: 'Department',
          attributes: ['id', 'department_name', 'department_code']
        },
        {
          model: Employee,
          as: 'HeadOfMajor',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Faculty,
          as: 'Faculty',
          attributes: ['id', 'faculty_code', 'faculty_name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(majors);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách ngành học");
  }
};

export const getMajorById = async (req, res) => {
  try {
    const major = await Major.findByPk(req.params.id, {
      include: [
        {
          model: Department,
          as: 'Department',
          attributes: ['id', 'department_name', 'department_code']
        },
        {
          model: Employee,
          as: 'HeadOfMajor',
          attributes: ['id', 'first_name', 'last_name', 'email']
        },
        {
          model: Faculty,
          as: 'Faculty',
          attributes: ['id', 'faculty_code', 'faculty_name']
        }
      ]
    });
    if (!major) {
      return res.status(404).json({ error: "Không tìm thấy ngành học" });
    }
    res.json(major);
  } catch (error) {
    handleError(res, error, "Không thể tải thông tin ngành học");
  }
};

export const createMajor = async (req, res) => {
  try {
    const {
      major_code, major_name, description, degree_type = 'bachelor',
      duration_years = 4, total_credits = 120, department_id,
      faculty_id,
      head_of_major_id, is_active = true
    } = req.body;

    if (!major_code || !major_name) {
      return res.status(400).json({
        error: "Mã ngành học và tên ngành học là bắt buộc"
      });
    }

    const cleanDepartmentId = department_id === '' ? null : department_id;
    const cleanHeadOfMajorId = head_of_major_id === '' ? null : head_of_major_id;
    const cleanFacultyId = faculty_id === '' ? null : faculty_id;
    const cleanDescription = description === '' ? null : description;

    const major = await Major.create({
      major_code,
      major_name,
      description: cleanDescription,
      degree_type,
      duration_years,
      total_credits,
      department_id: cleanDepartmentId,
      faculty_id: cleanFacultyId,
      head_of_major_id: cleanHeadOfMajorId,
      is_active
    });

    res.status(201).json(major);
  } catch (error) {
    handleError(res, error, "Không thể thêm ngành học");
  }
};

export const updateMajor = async (req, res) => {
  try {
    const major = await Major.findByPk(req.params.id);
    if (!major) {
      return res.status(404).json({ error: "Không tìm thấy ngành học" });
    }

    const updateData = { ...req.body };
    if (updateData.department_id === '') {
      updateData.department_id = null;
    }
    if (updateData.head_of_major_id === '') {
      updateData.head_of_major_id = null;
    }
    if (updateData.faculty_id === '') {
      updateData.faculty_id = null;
    }
    if (updateData.description === '') {
      updateData.description = null;
    }

    await major.update(updateData);
    res.json(major);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật ngành học");
  }
};

export const deleteMajor = async (req, res) => {
  try {
    const major = await Major.findByPk(req.params.id);
    if (!major) {
      return res.status(404).json({ error: "Không tìm thấy ngành học" });
    }

    await major.destroy();
    res.json({ message: "Xóa ngành học thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa ngành học");
  }
};

// ===================== Programs =====================
export const getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll({
      include: [
        {
          model: KnowledgeBlock,
          through: { attributes: [] },
          attributes: ["id", "block_code", "block_name", "total_credits", "is_required", "is_active"],
        },
        {
          model: Course,
          as: "Courses",
          attributes: ["id", "course_code", "course_name", "total_credits", "knowledge_block_id", "is_active"],
          through: { attributes: ["id", "semester", "notes", "course_type"] },
        },
        {
          model: Major,
          as: "Major",
          attributes: ["id", "major_code", "major_name"],
          required: false
        },
        {
          model: ProgramTuitionYear,
          as: "TuitionYears",
          attributes: ["id", "year", "total_credits", "tuition_paid", "tuition_remaining", "program_count"],
          required: false
        },
      ],
      order: [["created_at", "DESC"]],
    });
    const normalized = programs.map(p => {
      const json = p.toJSON();
      if (typeof json.total_credits === 'undefined') json.total_credits = null;
      if (!json.major_id && json.Major && json.Major.id) {
        json.major_id = json.Major.id;
      }
      if (Array.isArray(json.TuitionYears)) {
        json.TuitionYears = json.TuitionYears.sort((a, b) => b.year - a.year);
      }
      return json;
    });
    res.json(normalized);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách chương trình");
  }
};

export const getProgramById = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id, {
      include: [
        {
          model: KnowledgeBlock,
          through: { attributes: [] },
          attributes: ["id", "block_code", "block_name", "total_credits", "is_required", "is_active"],
        },
        {
          model: Course,
          as: "Courses",
          attributes: ["id", "course_code", "course_name", "total_credits", "knowledge_block_id", "is_active"],
          through: { attributes: ["id", "semester", "notes", "course_type"] },
        },
        {
          model: Major,
          as: "Major",
          attributes: ["id", "major_code", "major_name"],
          required: false
        },
        {
          model: ProgramTuitionYear,
          as: "TuitionYears",
          attributes: ["id", "year", "total_credits", "tuition_paid", "tuition_remaining", "program_count"],
          required: false
        },
      ],
    });
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }
    const json = program.toJSON();
    if (typeof json.total_credits === 'undefined') json.total_credits = null;
    if (!json.major_id && json.Major && json.Major.id) {
      json.major_id = json.Major.id;
    }
    if (Array.isArray(json.TuitionYears)) {
      json.TuitionYears = json.TuitionYears.sort((a, b) => b.year - a.year);
    }
    res.json(json);
  } catch (error) {
    handleError(res, error, "Không thể tải thông tin chương trình");
  }
};

export const getProgramCourses = async (req, res) => {
  const { id } = req.params;
  try {
    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }

    const programCourses = await ProgramCourse.findAll({
      where: { program_id: id },
      include: [
        {
          model: Course,
          attributes: ["id", "course_code", "course_name", "total_credits", "knowledge_block_id", "is_active"]
        },
        {
          model: KnowledgeBlock,
          as: "KnowledgeBlock",
          attributes: ["id", "block_code", "block_name"]
        }
      ],
      order: [["created_at", "DESC"]]
    });

    const payload = programCourses.map((item) => {
      const json = item.toJSON();
      return {
        id: json.id,
        program_id: json.program_id,
        course_id: json.course_id,
        course_type: json.course_type,
        semester: json.semester,
        notes: json.notes,
      knowledge_block_id: json.knowledge_block_id,
        Course: json.Course || null,
      KnowledgeBlock: json.KnowledgeBlock || null,
      };
    });

    res.json(payload);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách học phần của chương trình");
  }
};


export const addCourseToProgram = async (req, res) => {
  const { id } = req.params;
  try {
    const { course_id, course_type, semester, notes, knowledge_block_id } = req.body;

    if (!course_id) {
      return res.status(400).json({ error: "Học phần là bắt buộc" });
    }
    const normalizedCourseId = Number(course_id);
    if (!Number.isInteger(normalizedCourseId) || normalizedCourseId <= 0) {
      return res.status(400).json({ error: "ID học phần không hợp lệ" });
    }
    if (!course_type || !course_type.trim()) {
      return res.status(400).json({ error: "Loại học phần là bắt buộc" });
    }

    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }

    const course = await Course.findByPk(normalizedCourseId);
    if (!course) {
      return res.status(404).json({ error: "Không tìm thấy học phần" });
    }

    const existing = await ProgramCourse.findOne({
      where: { program_id: id, course_id: normalizedCourseId }
    });
    if (existing) {
      return res.status(409).json({ error: "Học phần đã tồn tại trong chương trình" });
    }

    let normalizedBlockId = null;
    if (knowledge_block_id !== undefined && knowledge_block_id !== null && knowledge_block_id !== "") {
      const parsed = Number(knowledge_block_id);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return res.status(400).json({ error: "Khối kiến thức không hợp lệ" });
      }
      const block = await KnowledgeBlock.findByPk(parsed);
      if (!block) {
        return res.status(404).json({ error: "Không tìm thấy khối kiến thức" });
      }
      const hasBlock = await program.hasKnowledgeBlock(block);
      if (!hasBlock) {
        return res.status(400).json({ error: "Khối kiến thức chưa được gắn vào chương trình" });
      }
      normalizedBlockId = parsed;
    }

    const parsedSemester =
      semester === undefined || semester === null || semester === ""
        ? null
        : Number.isInteger(Number(semester))
        ? Number(semester)
        : null;

    const relation = await ProgramCourse.create({
      program_id: id,
      course_id: normalizedCourseId,
      course_type: course_type.trim(),
      semester: parsedSemester,
      notes: notes && notes.trim() ? notes.trim() : null,
      knowledge_block_id: normalizedBlockId
    });

    const payload = await ProgramCourse.findByPk(relation.id, {
      include: [
        { model: Course, attributes: ["id", "course_code", "course_name", "total_credits", "knowledge_block_id", "is_active"] },
        { model: KnowledgeBlock, as: "KnowledgeBlock", attributes: ["id", "block_code", "block_name"] }
      ]
    });

    res.status(201).json(payload);
  } catch (error) {
    handleError(res, error, "Không thể thêm học phần vào chương trình");
  }
};

export const removeCourseFromProgram = async (req, res) => {
  const { id, courseId } = req.params;
  try {
    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }

    const normalizedCourseId = Number(courseId);
    if (!Number.isInteger(normalizedCourseId) || normalizedCourseId <= 0) {
      return res.status(400).json({ error: "ID học phần không hợp lệ" });
    }

    const relation = await ProgramCourse.findOne({
      where: { program_id: id, course_id: normalizedCourseId }
    });

    if (!relation) {
      return res.status(404).json({ error: "Học phần không tồn tại trong chương trình" });
    }

    await relation.destroy();
    res.json({ message: "Đã xóa học phần khỏi chương trình" });
  } catch (error) {
    handleError(res, error, "Không thể xóa học phần khỏi chương trình");
  }
};

export const updateProgramCourse = async (req, res) => {
  const { id, courseId } = req.params;
  try {
    const { course_type, semester, notes, knowledge_block_id } = req.body;
    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }
    const relation = await ProgramCourse.findOne({
      where: { program_id: id, course_id: courseId },
      include: [
        {
          model: Course,
          attributes: ["id", "course_code", "course_name", "total_credits", "knowledge_block_id", "is_active"]
        },
        {
          model: KnowledgeBlock,
          as: "KnowledgeBlock",
          attributes: ["id", "block_code", "block_name"]
        }
      ]
    });
    if (!relation) {
      return res.status(404).json({ error: "Không tìm thấy học phần trong chương trình" });
    }
    if (course_type !== undefined) {
      if (!course_type || !course_type.trim()) {
        return res.status(400).json({ error: "Loại học phần không hợp lệ" });
      }
      relation.course_type = course_type.trim();
    }
    if (semester !== undefined) {
      if (semester === null || semester === "") {
        relation.semester = null;
      } else if (!Number.isInteger(Number(semester))) {
        return res.status(400).json({ error: "Học kỳ phải là số nguyên" });
      } else {
        relation.semester = Number(semester);
      }
    }
    if (notes !== undefined) {
      relation.notes = notes && notes.trim() ? notes.trim() : null;
    }
    if (knowledge_block_id !== undefined) {
      if (knowledge_block_id === null || knowledge_block_id === "") {
        relation.knowledge_block_id = null;
      } else {
        const parsedBlockId = Number(knowledge_block_id);
        if (!Number.isInteger(parsedBlockId) || parsedBlockId <= 0) {
          return res.status(400).json({ error: "Khối kiến thức không hợp lệ" });
        }
        const block = await KnowledgeBlock.findByPk(parsedBlockId);
        if (!block) {
          return res.status(404).json({ error: "Không tìm thấy khối kiến thức" });
        }
        const hasBlock = await program.hasKnowledgeBlock(block);
        if (!hasBlock) {
          return res.status(400).json({ error: "Khối kiến thức chưa được gắn vào chương trình" });
        }
        relation.knowledge_block_id = parsedBlockId;
      }
    }
    await relation.save();
    const payload = relation.toJSON();
    res.json({
      id: payload.id,
      program_id: payload.program_id,
      course_id: payload.course_id,
      course_type: payload.course_type,
      semester: payload.semester,
      notes: payload.notes,
      knowledge_block_id: payload.knowledge_block_id,
      Course: payload.Course || null,
      KnowledgeBlock: payload.KnowledgeBlock || null
    });
  } catch (error) {
    handleError(res, error, "Không thể cập nhật học phần trong chương trình");
  }
};

export const addKnowledgeBlockToProgram = async (req, res) => {
  const { id } = req.params;
  const { knowledge_block_id } = req.body;
  try {
    if (!knowledge_block_id) {
      return res.status(400).json({ error: "Khối kiến thức là bắt buộc" });
    }
    const normalizedBlockId = Number(knowledge_block_id);
    if (!Number.isInteger(normalizedBlockId) || normalizedBlockId <= 0) {
      return res.status(400).json({ error: "ID khối kiến thức không hợp lệ" });
    }

    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }

    const block = await KnowledgeBlock.findByPk(normalizedBlockId);
    if (!block) {
      return res.status(404).json({ error: "Không tìm thấy khối kiến thức" });
    }

    const hasBlock = await program.hasKnowledgeBlock(block);
    if (hasBlock) {
      return res.status(409).json({ error: "Khối kiến thức đã tồn tại trong chương trình" });
    }

    await program.addKnowledgeBlock(block);
    const updatedBlocks = await program.getKnowledgeBlocks({
      attributes: ["id", "block_code", "block_name", "total_credits", "is_required", "is_active"]
    });
    res.status(201).json({
      message: "Đã thêm khối kiến thức vào chương trình",
      knowledge_blocks: updatedBlocks
    });
  } catch (error) {
    handleError(res, error, "Không thể thêm khối kiến thức vào chương trình");
  }
};

export const removeKnowledgeBlockFromProgram = async (req, res) => {
  const { id, blockId } = req.params;
  try {
    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }

    const block = await KnowledgeBlock.findByPk(blockId);
    if (!block) {
      return res.status(404).json({ error: "Không tìm thấy khối kiến thức" });
    }

    const hasBlock = await program.hasKnowledgeBlock(block);
    if (!hasBlock) {
      return res.status(404).json({ error: "Khối kiến thức không thuộc chương trình" });
    }

    await program.removeKnowledgeBlock(block);
    res.json({ message: "Đã xóa khối kiến thức khỏi chương trình" });
  } catch (error) {
    handleError(res, error, "Không thể xóa khối kiến thức khỏi chương trình");
  }
};

export const createProgram = async (req, res) => {
  try {
    const {
      program_code, program_name, description, start_date, end_date,
      start_year,
      is_active = true, major_id, knowledge_block_ids, course_ids, total_credits,
      tuition_years = []
    } = req.body;

    if (!program_code || !program_name) {
      return res.status(400).json({ error: "Mã chương trình và tên chương trình là bắt buộc" });
    }

    const normalizedTotalCredits = total_credits === undefined || total_credits === null || total_credits === ''
      ? null : Number(total_credits);

    if (normalizedTotalCredits !== null && (!Number.isInteger(normalizedTotalCredits) || normalizedTotalCredits < 0)) {
      return res.status(400).json({ error: "Số tín chỉ phải là số nguyên không âm" });
    }

    const normalizedMajorId = major_id === undefined || major_id === null || major_id === '' ? null : Number(major_id);
    const normalizedStartYear = normalizeStartYear(start_year ?? currentYear());

    let program = await Program.create({
      program_code, program_name,
      description: description === '' ? null : description,
      start_date: start_date === '' ? null : start_date,
      end_date: end_date === '' ? null : end_date,
      is_active, major_id: normalizedMajorId,
      start_year: normalizedStartYear,
      total_credits: normalizedTotalCredits
    });

    if (Array.isArray(knowledge_block_ids) && knowledge_block_ids.length > 0) {
      await program.setKnowledgeBlocks(knowledge_block_ids);
    }

    if (Array.isArray(course_ids)) {
      const normalizedCourseIds = [...new Set(course_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
      await program.setCourses(normalizedCourseIds);
    }

    if (normalizedTotalCredits === null) {
      await recalculateProgramTotalCredits(program);
    }

    const tuitionRecords = await ensureProgramTuitionYears(program, normalizedStartYear, tuition_years);

    program = await Program.findByPk(program.id, {
      include: [
        { model: KnowledgeBlock, through: { attributes: [] }, attributes: ["id", "block_code", "block_name", "total_credits", "is_required", "is_active"] },
        { model: Course, as: "Courses", attributes: ["id", "course_code", "course_name", "total_credits", "knowledge_block_id", "is_active"], through: { attributes: ["id", "semester", "notes", "course_type"] } },
        { model: Major, as: "Major", attributes: ["id", "major_code", "major_name"], required: false },
        { model: ProgramTuitionYear, as: "TuitionYears", attributes: ["id", "year", "total_credits", "tuition_paid", "tuition_remaining", "program_count"], required: false }
      ],
    });

    const json = program.toJSON();
    if (typeof json.total_credits === 'undefined') json.total_credits = null;
    if (!json.major_id && json.Major && json.Major.id) {
      json.major_id = json.Major.id;
    }
    if (Array.isArray(json.TuitionYears)) {
      json.TuitionYears = json.TuitionYears.sort((a, b) => b.year - a.year);
    } else if (tuitionRecords?.length) {
      json.TuitionYears = tuitionRecords.map((record) => record.toJSON()).sort((a, b) => b.year - a.year);
    }
    res.status(201).json(json);
  } catch (error) {
    handleError(res, error, "Không thể thêm chương trình");
  }
};

export const updateProgram = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }

    const { tuition_years = [] } = req.body;
    const updateData = { ...req.body };
    delete updateData.knowledge_block_ids;
    delete updateData.course_ids;
    delete updateData.tuition_years;

    if ("total_credits" in req.body) {
      const normalizedTotalCredits = req.body.total_credits === undefined || req.body.total_credits === null || req.body.total_credits === ''
        ? null : Number(req.body.total_credits);
      if (normalizedTotalCredits !== null && (!Number.isInteger(normalizedTotalCredits) || normalizedTotalCredits < 0)) {
        return res.status(400).json({ error: "Số tín chỉ phải là số nguyên không âm" });
      }
      updateData.total_credits = normalizedTotalCredits;
    }

    if ("price_per_credit" in req.body) {
      const normalizedPrice = req.body.price_per_credit === undefined || req.body.price_per_credit === null || req.body.price_per_credit === ''
        ? null : Number(req.body.price_per_credit);
      if (normalizedPrice !== null && (!Number.isFinite(normalizedPrice) || normalizedPrice < 0)) {
        return res.status(400).json({ error: "Giá tín chỉ phải là số dương" });
      }
      updateData.price_per_credit = normalizedPrice;
    }

    if ("major_id" in req.body) {
      const normalizedMajorId = req.body.major_id === undefined || req.body.major_id === null || req.body.major_id === ''
        ? null : Number(req.body.major_id);
      if (normalizedMajorId !== null && (!Number.isInteger(normalizedMajorId) || normalizedMajorId <= 0)) {
        return res.status(400).json({ error: "ID ngành học không hợp lệ" });
      }
      updateData.major_id = normalizedMajorId;
    }

    if ("start_year" in req.body) {
      updateData.start_year = normalizeStartYear(req.body.start_year);
    }

    if (updateData.description === '') updateData.description = null;
    if (updateData.start_date === '') updateData.start_date = null;
    if (updateData.end_date === '') updateData.end_date = null;

    await program.update(updateData);

    if (Array.isArray(req.body.knowledge_block_ids)) {
      await program.setKnowledgeBlocks(req.body.knowledge_block_ids);
    }

    if (Array.isArray(req.body.course_ids)) {
      const normalizedCourseIds = [...new Set(req.body.course_ids.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
      await program.setCourses(normalizedCourseIds);
    }

    const provided = Object.prototype.hasOwnProperty.call(req.body, "total_credits");
    const providedIsNullish = req.body.total_credits === '' || req.body.total_credits === null || req.body.total_credits === undefined;
    if (!provided || providedIsNullish) {
      await recalculateProgramTotalCredits(program);
    }

    const effectiveStartYear = program.start_year || currentYear();
    await ensureProgramTuitionYears(program, effectiveStartYear, tuition_years);

    await program.reload({
      include: [
        { model: KnowledgeBlock, through: { attributes: [] }, attributes: ["id", "block_code", "block_name", "total_credits", "is_required", "is_active"] },
        { model: Course, as: "Courses", attributes: ["id", "course_code", "course_name", "total_credits", "knowledge_block_id", "is_active"], through: { attributes: ["id", "semester", "notes", "course_type"] } },
        { model: Major, as: "Major", attributes: ["id", "major_code", "major_name"], required: false },
        { model: ProgramTuitionYear, as: "TuitionYears", attributes: ["id", "year", "total_credits", "tuition_paid", "tuition_remaining", "program_count"], required: false }
      ],
    });

    const json = program.toJSON();
    if (typeof json.total_credits === 'undefined') json.total_credits = null;
    if (!json.major_id && json.Major && json.Major.id) {
      json.major_id = json.Major.id;
    }
    if (Array.isArray(json.TuitionYears)) {
      json.TuitionYears = json.TuitionYears.sort((a, b) => b.year - a.year);
    }
    res.json(json);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật chương trình");
  }
};

export const deleteProgram = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }

    const sequelize = (await import("../config/database.js")).default;
    const { CurriculumStructure, Cohort } = await import("../models/index.js");

    await sequelize.transaction(async (transaction) => {
      await program.setKnowledgeBlocks([], { transaction });
      await program.setCourses([], { transaction });
      await CurriculumStructure.update({ program_id: null }, { where: { program_id: program.id }, transaction });
      await Cohort.update({ program_id: null }, { where: { program_id: program.id }, transaction });
      await program.destroy({ transaction });
    });

    res.json({ message: "Xóa chương trình thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa chương trình");
  }
};

// ===================== Courses =====================
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.findAll({
      include: [
        { model: CourseCategory, as: "CourseCategory", required: false, attributes: ["id", "category_name"] },
        { model: Department, as: "Department", required: false, attributes: ["id", "department_name"] },
        { model: Faculty, as: "Faculty", required: false, attributes: ["id", "faculty_name", "faculty_code"] },
        { model: Employee, as: "CreatedBy", required: false, attributes: ["id", "first_name", "last_name"] }
      ],
      order: [["created_at", "DESC"]]
    });
    res.json(courses);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách học phần");
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: CourseCategory, as: "CourseCategory", required: false },
        { model: Department, as: "Department", required: false },
        { model: Faculty, as: "Faculty", required: false },
        { model: Employee, as: "CreatedBy", required: false }
      ]
    });
    if (!course) {
      return res.status(404).json({ error: "Không tìm thấy học phần" });
    }
    res.json(course);
  } catch (error) {
    handleError(res, error, "Không thể tải thông tin học phần");
  }
};

export const createCourse = async (req, res) => {
  try {
    let {
      course_code, course_name, description, category_id,
      duration_hours, total_credits, theory_credits, practice_credits, level,
      prerequisite_course_ids, concurrent_course_ids, learning_objectives,
      department_id, faculty_id, created_by, is_active = true
    } = req.body;

    if (!course_code || !course_name) {
      return res.status(400).json({ error: "Mã học phần và tên học phần là bắt buộc" });
    }

    if (category_id === "" || category_id === undefined) category_id = null;
    if (department_id === "" || department_id === undefined) department_id = null;
    if (faculty_id === "" || faculty_id === undefined) faculty_id = null;
    if (created_by === "" || created_by === undefined) created_by = null;

    const course = await Course.create({
      course_code, course_name, description, category_id,
      duration_hours, total_credits, theory_credits, practice_credits, level,
      prerequisite_course_ids, concurrent_course_ids, learning_objectives,
      department_id, faculty_id, created_by, is_active
    });

    res.status(201).json(course);
  } catch (error) {
    handleError(res, error, "Không thể thêm học phần");
  }
};

export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Không tìm thấy học phần" });
    }

    const allowedFields = [
      "course_name", "description", "category_id", "duration_hours",
      "total_credits", "theory_credits", "practice_credits", "level",
      "prerequisite_course_ids", "concurrent_course_ids", "learning_objectives",
      "department_id", "faculty_id", "is_active"
    ];

    await course.update(req.body, { fields: allowedFields });
    res.json(course);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật học phần");
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Không tìm thấy học phần" });
    }

    await course.destroy();
    res.json({ message: "Xóa học phần thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa học phần");
  }
};

export const getCourseNamesByIds = async (req, res) => {
  try {
    const { courseIds } = req.body;
    if (!courseIds || courseIds.length === 0) {
      return res.json([]);
    }
    const courses = await Course.findAll({
      where: { id: courseIds },
      attributes: ['id', 'course_code', 'course_name']
    });
    res.json(courses);
  } catch (error) {
    handleError(res, error, "Không thể lấy tên học phần");
  }
};

export const checkPrerequisites = async (req, res) => {
  try {
    const { courseId, employeeId } = req.body;
    // Basic implementation - can be enhanced later
    res.json({ canEnroll: true, message: "Có thể đăng ký" });
  } catch (error) {
    handleError(res, error, "Không thể kiểm tra điều kiện tiên quyết");
  }
};

// ===================== Course Categories =====================
export const getAllCourseCategories = async (req, res) => {
  try {
    const categories = await CourseCategory.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json(categories);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách danh mục học phần");
  }
};

export const getCourseCategoryById = async (req, res) => {
  try {
    const category = await CourseCategory.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Không tìm thấy danh mục học phần" });
    }
    res.json(category);
  } catch (error) {
    handleError(res, error, "Không thể tải thông tin danh mục học phần");
  }
};

// ===================== Knowledge Blocks =====================
export const getAllKnowledgeBlocks = async (req, res) => {
  try {
    const blocks = await KnowledgeBlock.findAll({
      include: [{ model: Major, as: 'Major', attributes: ['id', 'major_name', 'major_code'] }],
      order: [['created_at', 'DESC']]
    });
    res.json(blocks);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách khối kiến thức");
  }
};

export const createKnowledgeBlock = async (req, res) => {
  try {
    const {
      block_code,
      block_name,
      description,
      total_credits = 0,
      min_credits = null,
      max_credits = null,
      is_required = true,
      major_id,
      is_active = true
    } = req.body;
    if (!block_code || !block_name) {
      return res.status(400).json({ error: "Mã khối và tên khối là bắt buộc" });
    }

    const normalizedMin =
      min_credits === null || min_credits === "" ? null : Number.isFinite(Number(min_credits)) ? Number(min_credits) : null;
    const normalizedMax =
      max_credits === null || max_credits === "" ? null : Number.isFinite(Number(max_credits)) ? Number(max_credits) : null;

    if (normalizedMin !== null && normalizedMin < 0) {
      return res.status(400).json({ error: "Tín chỉ tối thiểu phải >= 0" });
    }
    if (normalizedMax !== null && normalizedMax < 0) {
      return res.status(400).json({ error: "Tín chỉ tối đa phải >= 0" });
    }
    if (normalizedMin !== null && normalizedMax !== null && normalizedMin > normalizedMax) {
      return res.status(400).json({ error: "Tín chỉ tối thiểu phải nhỏ hơn hoặc bằng tín chỉ tối đa" });
    }

    const normalizedTotal =
      normalizedMax !== null
        ? normalizedMax
        : normalizedMin !== null
        ? normalizedMin
        : Number.isFinite(Number(total_credits))
        ? Number(total_credits)
        : 0;

    const block = await KnowledgeBlock.create({
      block_code,
      block_name,
      description: description || null,
      min_credits: normalizedMin,
      max_credits: normalizedMax,
      total_credits: normalizedTotal,
      is_required,
      major_id: major_id || null,
      is_active
    });
    res.status(201).json(block);
  } catch (error) {
    handleError(res, error, "Không thể thêm khối kiến thức");
  }
};

export const updateKnowledgeBlock = async (req, res) => {
  try {
    const block = await KnowledgeBlock.findByPk(req.params.id);
    if (!block) return res.status(404).json({ error: "Không tìm thấy khối kiến thức" });
    const updateData = { ...req.body };
    if (updateData.description === '') updateData.description = null;
    if (updateData.major_id === '' || updateData.major_id === undefined) updateData.major_id = null;

    const normalizedMin =
      updateData.min_credits === undefined
        ? block.min_credits
        : updateData.min_credits === null || updateData.min_credits === ""
        ? null
        : Number(updateData.min_credits);
    const normalizedMax =
      updateData.max_credits === undefined
        ? block.max_credits
        : updateData.max_credits === null || updateData.max_credits === ""
        ? null
        : Number(updateData.max_credits);

    if (normalizedMin !== null && (Number.isNaN(normalizedMin) || normalizedMin < 0)) {
      return res.status(400).json({ error: "Tín chỉ tối thiểu phải >= 0" });
    }
    if (normalizedMax !== null && (Number.isNaN(normalizedMax) || normalizedMax < 0)) {
      return res.status(400).json({ error: "Tín chỉ tối đa phải >= 0" });
    }
    if (normalizedMin !== null && normalizedMax !== null && normalizedMin > normalizedMax) {
      return res.status(400).json({ error: "Tín chỉ tối thiểu phải nhỏ hơn hoặc bằng tín chỉ tối đa" });
    }

    updateData.min_credits = normalizedMin;
    updateData.max_credits = normalizedMax;

    if (updateData.min_credits === null && updateData.max_credits === null && updateData.total_credits === undefined) {
      // keep existing total
    } else {
      const fallbackTotal =
        updateData.max_credits ?? updateData.min_credits ?? updateData.total_credits ?? block.total_credits ?? 0;
      updateData.total_credits = fallbackTotal;
    }

    await block.update(updateData);
    res.json(block);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật khối kiến thức");
  }
};

export const deleteKnowledgeBlock = async (req, res) => {
  try {
    const block = await KnowledgeBlock.findByPk(req.params.id);
    if (!block) return res.status(404).json({ error: "Không tìm thấy khối kiến thức" });

    await sequelize.transaction(async (transaction) => {
      try {
        await block.setPrograms([], { transaction });
      } catch (e) {
        await sequelize.query("DELETE FROM program_knowledge_blocks WHERE knowledge_block_id = ?", { replacements: [block.id], transaction });
      }
      await CurriculumStructure.destroy({ where: { knowledge_block_id: block.id }, transaction });
      await Course.update({ knowledge_block_id: null }, { where: { knowledge_block_id: block.id }, transaction });
      await block.destroy({ transaction });
    });

    res.json({ message: "Xóa khối kiến thức thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa khối kiến thức");
  }
};

// ===================== Curriculum Structure =====================
export const getAllCurriculumStructures = async (req, res) => {
  try {
    const structures = await CurriculumStructure.findAll({
      include: [
        { model: Major, as: 'Major', attributes: ['id', 'major_name', 'major_code'] },
        { model: KnowledgeBlock, as: 'KnowledgeBlock', attributes: ['id', 'block_name', 'block_code'] },
        { model: Program, as: 'Program', attributes: ['id', 'program_name', 'program_code'] },
        { model: Course, as: 'Course', attributes: ['id', 'course_code', 'course_name', 'total_credits'] }
      ],
      order: [['program_id', 'ASC'], ['major_id', 'ASC'], ['semester', 'ASC']]
    });
    res.json(structures);
  } catch (error) {
    handleError(res, error, "Không thể tải cấu trúc CTĐT");
  }
};

export const createCurriculumStructure = async (req, res) => {
  try {
    const { program_id, major_id, knowledge_block_id, course_id, semester, is_required = true, min_credits = 0, notes } = req.body;
    if (!program_id || !major_id || !knowledge_block_id) {
      return res.status(400).json({ error: "Chương trình đào tạo, ngành học và khối kiến thức là bắt buộc" });
    }
    const structure = await CurriculumStructure.create({
      program_id,
      major_id,
      knowledge_block_id,
      course_id: course_id || null,
      semester,
      is_required,
      min_credits,
      notes: notes || null
    });
    res.status(201).json(structure);
  } catch (error) {
    handleError(res, error, "Không thể thêm cấu trúc");
  }
};

export const updateCurriculumStructure = async (req, res) => {
  try {
    const structure = await CurriculumStructure.findByPk(req.params.id);
    if (!structure) return res.status(404).json({ error: "Không tìm thấy cấu trúc" });
    await structure.update(req.body);
    res.json(structure);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật cấu trúc");
  }
};

export const deleteCurriculumStructure = async (req, res) => {
  try {
    const structure = await CurriculumStructure.findByPk(req.params.id);
    if (!structure) return res.status(404).json({ error: "Không tìm thấy cấu trúc" });
    await structure.destroy();
    res.json({ message: "Xóa thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa cấu trúc");
  }
};

// ===================== Curriculum Viewer =====================
export const getFullCurriculum = async (req, res) => {
  try {
    const programs = await Program.findAll({
      include: [
        {
          model: KnowledgeBlock,
          through: { attributes: [] },
          attributes: ["id", "block_code", "block_name", "total_credits"],
          include: [
            {
              model: Course,
              as: "Courses",
              attributes: ["id", "course_code", "course_name", "total_credits", "duration_hours", "level"]
            }
          ]
        }
      ],
      order: [["created_at", "DESC"]],
    });
    if (!programs.length) {
      return res.status(404).json({ message: "Không có chương trình đào tạo nào." });
    }
    res.json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (error) {
    console.error("❌ Curriculum Viewer API Error:", error);
    handleError(res, error, "Không thể tải dữ liệu hiển thị CTĐT");
  }
};

// ===================== Cohorts =====================
export const getAllCohorts = async (req, res) => {
  try {
    const cohorts = await Cohort.findAll({
      include: [
        { model: Program, as: 'Program', attributes: ['id', 'program_code', 'program_name'] },
        { model: Major, as: 'Major', attributes: ['id', 'major_code', 'major_name'] },
        { model: Employee, as: 'Instructor', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(cohorts);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách lớp học");
  }
};

export const getCohortById = async (req, res) => {
  try {
    const cohort = await Cohort.findByPk(req.params.id, {
      include: [
        { model: Program, as: 'Program', attributes: ['id', 'program_code', 'program_name'] },
        { model: Major, as: 'Major', attributes: ['id', 'major_code', 'major_name'] },
        { model: Employee, as: 'Instructor', attributes: ['id', 'first_name', 'last_name', 'email'] }
      ]
    });
    if (!cohort) {
      return res.status(404).json({ error: "Không tìm thấy lớp học" });
    }
    res.json(cohort);
  } catch (error) {
    handleError(res, error, "Không thể tải thông tin lớp học");
  }
};

export const createCohort = async (req, res) => {
  try {
    const {
      cohort_code, cohort_name, description, start_date, end_date,
      max_students = 30, current_students = 0, status = 'planning',
      program_id, major_id, instructor_id
    } = req.body;

    if (!cohort_code || !cohort_name || !start_date) {
      return res.status(400).json({
        error: "Mã lớp học, tên lớp học và ngày bắt đầu là bắt buộc"
      });
    }

    const cleanProgramId = program_id === '' ? null : program_id;
    const cleanMajorId = major_id === '' ? null : major_id;
    const cleanInstructorId = instructor_id === '' ? null : instructor_id;
    const cleanEndDate = end_date === '' ? null : end_date;
    const cleanDescription = description === '' ? null : description;

    const cohort = await Cohort.create({
      cohort_code, cohort_name, description: cleanDescription,
      start_date, end_date: cleanEndDate, max_students, current_students,
      status, program_id: cleanProgramId, major_id: cleanMajorId, instructor_id: cleanInstructorId
    });

    res.status(201).json(cohort);
  } catch (error) {
    handleError(res, error, "Không thể thêm lớp học");
  }
};

export const updateCohort = async (req, res) => {
  try {
    const cohort = await Cohort.findByPk(req.params.id);
    if (!cohort) {
      return res.status(404).json({ error: "Không tìm thấy lớp học" });
    }

    const updateData = { ...req.body };
    if (updateData.program_id === '') updateData.program_id = null;
    if (updateData.major_id === '') updateData.major_id = null;
    if (updateData.instructor_id === '') updateData.instructor_id = null;
    if (updateData.end_date === '') updateData.end_date = null;
    if (updateData.description === '') updateData.description = null;

    await cohort.update(updateData);
    res.json(cohort);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật lớp học");
  }
};

export const deleteCohort = async (req, res) => {
  try {
    const cohort = await Cohort.findByPk(req.params.id);
    if (!cohort) {
      return res.status(404).json({ error: "Không tìm thấy lớp học" });
    }

    await cohort.destroy();
    res.json({ message: "Xóa lớp học thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa lớp học");
  }
};

// ===================== Employees =====================
export const getAllEmployees = async (req, res) => {
  try {
    const { type } = req.query;
    const where = {};
    if (type && ['lecturer', 'staff'].includes(type)) {
      where.employee_type = type;
    }

    const employees = await Employee.findAll({
      where,
      include: [
        { model: Department, attributes: ['id', 'department_name', 'department_code'] },
        { model: Position, attributes: ['id', 'position_name', 'position_code', 'level'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(employees);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách nhân viên");
  }
};

export const getLecturers = async (req, res) => {
  try {
    const lecturers = await Employee.findAll({
      where: { employee_type: 'lecturer' },
      include: [
        { model: Department, attributes: ['id', 'department_name', 'department_code'] },
        { model: Position, attributes: ['id', 'position_name', 'position_code', 'level'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(lecturers);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách giảng viên");
  }
};

export const getStaff = async (req, res) => {
  try {
    const staff = await Employee.findAll({
      where: { employee_type: 'staff' },
      include: [
        { model: Department, attributes: ['id', 'department_name', 'department_code'] },
        { model: Position, attributes: ['id', 'position_name', 'position_code', 'level'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(staff);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách nhân viên hành chính");
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['id', 'department_name', 'department_code'] },
        { model: Position, attributes: ['id', 'position_name', 'position_code', 'level'] }
      ]
    });
    if (!employee) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên" });
    }
    res.json(employee);
  } catch (error) {
    handleError(res, error, "Không thể tải thông tin nhân viên");
  }
};

export const createEmployee = async (req, res) => {
  try {
    const {
      employee_code, first_name, last_name, email, phone, address,
      date_of_birth, gender, employee_type = 'staff', id_card,
      position_id, department_id, manager_id, hire_date, salary,
      status = 'Active'
    } = req.body;

    if (!employee_code || !first_name || !last_name || !email || !position_id || !department_id || !hire_date) {
      return res.status(400).json({
        error: "Mã nhân viên, họ tên, email, chức vụ, phòng ban và ngày tuyển dụng là bắt buộc"
      });
    }

    const cleanManagerId = manager_id === '' ? null : manager_id;
    const cleanIdCard = id_card === '' ? null : id_card;
    const cleanAddress = address === '' ? null : address;
    const cleanPhone = phone === '' ? null : phone;

    const employee = await Employee.create({
      employee_code, first_name, last_name, email,
      phone: cleanPhone, address: cleanAddress, date_of_birth, gender,
      employee_type, id_card: cleanIdCard, position_id, department_id,
      manager_id: cleanManagerId, hire_date, salary, status
    });

    res.status(201).json(employee);
  } catch (error) {
    handleError(res, error, "Không thể thêm nhân viên");
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên" });
    }

    const updateData = { ...req.body };
    if (updateData.manager_id === '') updateData.manager_id = null;
    if (updateData.id_card === '') updateData.id_card = null;
    if (updateData.address === '') updateData.address = null;
    if (updateData.phone === '') updateData.phone = null;

    await employee.update(updateData);
    res.json(employee);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật nhân viên");
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Không tìm thấy nhân viên" });
    }

    await employee.destroy();
    res.json({ message: "Xóa nhân viên thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa nhân viên");
  }
};

// ===================== Positions =====================
export const getAllPositions = async (req, res) => {
  try {
    const positions = await Position.findAll({
      include: [{
        model: Department,
        attributes: ['id', 'department_name', 'department_code']
      }],
      order: [['created_at', 'DESC']]
    });
    res.json(positions);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách chức vụ");
  }
};

export const createPosition = async (req, res) => {
  try {
    const { position_code, position_name, level, description, department_id, is_active = true } = req.body;
    const cleanDepartmentId = department_id === '' || department_id === null || department_id === undefined ? null : department_id;

    if (!position_code || !position_name) {
      return res.status(400).json({
        error: "Mã chức vụ và tên chức vụ là bắt buộc"
      });
    }

    const position = await Position.create({
      position_code, position_name, level, description,
      department_id: cleanDepartmentId, is_active
    });

    res.status(201).json(position);
  } catch (error) {
    handleError(res, error, "Không thể thêm chức vụ");
  }
};

export const updatePosition = async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id);
    if (!position) {
      return res.status(404).json({ error: "Không tìm thấy chức vụ" });
    }
    
    // Xử lý department_id: nếu là empty string hoặc null thì set thành null
    const updateData = { ...req.body };
    if (updateData.department_id === '' || updateData.department_id === null || updateData.department_id === undefined) {
      updateData.department_id = null;
    }
    
    await position.update(updateData);
    res.json(position);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật chức vụ");
  }
};

export const deletePosition = async (req, res) => {
  try {
    const position = await Position.findByPk(req.params.id);
    if (!position) {
      return res.status(404).json({ error: "Không tìm thấy chức vụ" });
    }
    await position.destroy();
    res.json({ message: "Xóa chức vụ thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa chức vụ");
  }
};

// ===================== Users =====================
const normalizeDepartmentIdValue = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (value === '' || value === 'phenikaa') return null;
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
};

// Map employee to user format for frontend compatibility
const mapEmployeeToUser = (emp) => {
  if (!emp) return null;
  const empData = emp.toJSON();
  const managementPositionsStr = empData.management_positions || '';
  const managementPositionsArr = managementPositionsStr 
    ? String(managementPositionsStr).split(',').map(s => s.trim()).filter(Boolean)
    : [];
  return {
    ...empData,
    full_name: `${empData.first_name || ''} ${empData.last_name || ''}`.trim(),
    user_id: empData.employee_code,
    role: empData.employee_type,
    organization_unit_id: empData.department_id,
    active: empData.status === 'Active' ? 'Đang làm việc' : 'Nghỉ việc',
    degree: empData.degree || null,
    degrees: empData.degree ? String(empData.degree).split(',').map(s => s.trim()).filter(Boolean) : [],
    position: empData.Position?.position_name || null,
    // Nếu department_id là null, hiển thị "Đại Học Phenikaa" mặc định
    OrganizationUnit: empData.Department 
      ? { id: empData.Department.id, name: empData.Department.department_name } 
      : { id: null, name: 'Đại Học Phenikaa' },
    Faculty: empData.Faculty ? { id: empData.Faculty.id, faculty_code: empData.Faculty.faculty_code, faculty_name: empData.Faculty.faculty_name } : null,
    management_positions: managementPositionsArr
  };
};

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const where = {};
    if (role && ['lecturer', 'staff'].includes(role)) {
      where.employee_type = role;
    }

    const employees = await Employee.findAll({
      where,
      include: [
        { model: Department, attributes: ['id', 'department_name', 'department_code'] },
        { model: Position, attributes: ['id', 'position_name', 'position_code', 'level'] },
        { model: Faculty, as: 'Faculty', attributes: ['id', 'faculty_code', 'faculty_name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    
    const mappedEmployees = employees.map(mapEmployeeToUser);
    res.json(mappedEmployees);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách người dùng");
  }
};

export const getUserById = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['id', 'department_name', 'department_code'] },
        { model: Position, attributes: ['id', 'position_name', 'position_code', 'level'] },
        { model: Faculty, as: 'Faculty', attributes: ['id', 'faculty_code', 'faculty_name'] }
      ]
    });
    if (!employee) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    
    const mappedEmployee = mapEmployeeToUser(employee);
    res.json(mappedEmployee);
  } catch (error) {
    handleError(res, error, "Không thể tải thông tin người dùng");
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      user_id, full_name, role, gender, degree, position, organization_unit_id,
      email, phone, address, active,
      employee_code, first_name, last_name, employee_type,
      position_id, department_id, manager_id, hire_date, salary, status,
      salary_coefficient, salary_level, avatar_url, faculty_id, management_positions
    } = req.body;

    let employeeData = {};
    if (user_id || employee_code) {
      employeeData.employee_code = employee_code || user_id;
    }
    if (full_name) {
      const nameParts = full_name.trim().split(/\s+/);
      employeeData.first_name = nameParts.slice(0, -1).join(' ') || full_name;
      employeeData.last_name = nameParts[nameParts.length - 1] || '';
    } else {
      employeeData.first_name = first_name;
      employeeData.last_name = last_name;
    }
    
    employeeData.employee_type = employee_type || (role === 'lecturer' ? 'lecturer' : 'staff');
    employeeData.email = email;
    employeeData.phone = phone;
    employeeData.address = address;
    employeeData.gender = gender || 'Other';
    if (Array.isArray(degree)) {
      employeeData.degree = degree.join(', ');
    } else if (degree !== undefined) {
      employeeData.degree = degree;
    }
    employeeData.position_id = position_id || position;
    const normalizedOrgUnitId = normalizeDepartmentIdValue(organization_unit_id);
    const normalizedDepartmentId = normalizeDepartmentIdValue(department_id);
    if (normalizedOrgUnitId !== undefined) {
      employeeData.department_id = normalizedOrgUnitId;
    } else if (normalizedDepartmentId !== undefined) {
      employeeData.department_id = normalizedDepartmentId;
    } else {
      employeeData.department_id = null;
    }
    employeeData.manager_id = manager_id;
    employeeData.hire_date = hire_date || new Date().toISOString().split('T')[0];
    employeeData.salary = salary;
    employeeData.salary_coefficient = salary_coefficient !== undefined && salary_coefficient !== '' ? Number(salary_coefficient) : null;
    employeeData.salary_level = salary_level !== undefined && salary_level !== '' ? Number(salary_level) : null;
    employeeData.status = status || (active === 'Đang làm việc' ? 'Active' : 'Inactive');
    employeeData.faculty_id = faculty_id || null;
    if (management_positions !== undefined) {
      employeeData.management_positions = management_positions || null;
    }
    if (avatar_url !== undefined) {
      employeeData.avatar_url = avatar_url || null;
    }

    if (!employeeData.position_id) {
      let fallbackDepartmentId = employeeData.department_id;
      if (!fallbackDepartmentId) {
        fallbackDepartmentId = await Department.min('id');
      }
      if (!fallbackDepartmentId) {
        return res.status(400).json({ error: "Vui lòng chọn phòng ban trước khi tạo giảng viên" });
      }
      let defaultPosition = await Position.findOne({ where: { position_code: 'LECTURER_DEFAULT' } });
      if (!defaultPosition) {
        defaultPosition = await Position.create({
          position_code: 'LECTURER_DEFAULT',
          position_name: 'Giảng viên',
          level: 1,
          description: 'Vị trí mặc định cho giảng viên',
          department_id: fallbackDepartmentId,
          is_active: true,
        });
      }
      employeeData.position_id = defaultPosition.id;
      if (!employeeData.department_id && defaultPosition.department_id) {
        employeeData.department_id = defaultPosition.department_id;
      }
    }

    // Cho phép department_id là null cho giảng viên (đơn vị mặc định là "Đại Học Phenikaa")
    const isLecturer = employeeData.employee_type === 'lecturer';
    if (!employeeData.employee_code || !employeeData.first_name || !employeeData.last_name || 
        !employeeData.email || !employeeData.position_id || (!isLecturer && !employeeData.department_id)) {
      return res.status(400).json({
        error: isLecturer 
          ? "Mã nhân viên, họ tên, email và chức vụ là bắt buộc"
          : "Mã nhân viên, họ tên, email, chức vụ và phòng ban là bắt buộc"
      });
    }

    const employee = await Employee.create(employeeData);
    
    // Đồng bộ dean_id sau khi tạo employee
    if (employeeData.faculty_id && employeeData.management_positions) {
      await syncDeanFromEmployee(employee.id, employeeData.faculty_id, employeeData.management_positions);
    }
    
    const newEmployee = await Employee.findByPk(employee.id, {
      include: [
        { model: Department, attributes: ['id', 'department_name', 'department_code'] },
        { model: Position, attributes: ['id', 'position_name', 'position_code', 'level'] },
        { model: Faculty, as: 'Faculty', attributes: ['id', 'faculty_code', 'faculty_name'] }
      ]
    });
    
    const mappedEmployee = mapEmployeeToUser(newEmployee);
    res.status(201).json(mappedEmployee);
  } catch (error) {
    handleError(res, error, "Không thể thêm người dùng");
  }
};

export const updateUser = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    const {
      user_id, full_name, role, gender, degree, position, organization_unit_id,
      email, phone, address, active,
      employee_code, first_name, last_name, employee_type,
      position_id, department_id, manager_id, hire_date, salary, status,
      faculty_id, management_positions, salary_coefficient, salary_level,
      avatar_url
    } = req.body;

    const updateData = {};
    if (user_id !== undefined) updateData.employee_code = user_id;
    if (employee_code !== undefined) updateData.employee_code = employee_code;
    if (full_name) {
      const nameParts = full_name.trim().split(/\s+/);
      updateData.first_name = nameParts.slice(0, -1).join(' ') || full_name;
      updateData.last_name = nameParts[nameParts.length - 1] || '';
    } else {
      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
    }
    if (role !== undefined) updateData.employee_type = role === 'lecturer' ? 'lecturer' : 'staff';
    if (employee_type !== undefined) updateData.employee_type = employee_type;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone === '' ? null : phone;
    if (address !== undefined) updateData.address = address === '' ? null : address;
    if (gender !== undefined) updateData.gender = gender;
    if (degree !== undefined) {
      if (Array.isArray(degree)) {
        updateData.degree = degree.length ? degree.join(', ') : null;
      } else {
        updateData.degree = degree === '' ? null : degree;
      }
    }
    if (position_id !== undefined) updateData.position_id = position_id;
    if (position !== undefined && position !== '') updateData.position_id = position;
    const normalizedUpdateDepartmentId = normalizeDepartmentIdValue(department_id);
    if (normalizedUpdateDepartmentId !== undefined) {
      updateData.department_id = normalizedUpdateDepartmentId;
    }
    // Cho phép organization_unit_id là null (để set department_id = null cho "Đại Học Phenikaa")
    const normalizedUpdateOrgUnitId = normalizeDepartmentIdValue(organization_unit_id);
    if (normalizedUpdateOrgUnitId !== undefined) {
      updateData.department_id = normalizedUpdateOrgUnitId;
    }
    if (manager_id !== undefined) updateData.manager_id = manager_id === '' ? null : manager_id;
    if (hire_date !== undefined) updateData.hire_date = hire_date;
    if (salary !== undefined) updateData.salary = salary;
    if (salary_coefficient !== undefined) updateData.salary_coefficient = salary_coefficient === '' ? null : (salary_coefficient ? Number(salary_coefficient) : null);
    if (salary_level !== undefined) updateData.salary_level = salary_level === '' ? null : (salary_level ? Number(salary_level) : null);
    if (status !== undefined) updateData.status = status;
    if (active !== undefined) updateData.status = active === 'Đang làm việc' ? 'Active' : 'Inactive';
    // Lưu giá trị cũ trước khi cập nhật
    const oldFacultyId = employee.faculty_id;
    const oldManagementPositions = employee.management_positions;
    
    if (faculty_id !== undefined) updateData.faculty_id = faculty_id === '' ? null : faculty_id;
    if (management_positions !== undefined) {
      updateData.management_positions = management_positions === '' ? null : management_positions;
    }
    if (avatar_url !== undefined) {
      updateData.avatar_url = avatar_url === '' ? null : avatar_url;
    }

    await employee.update(updateData);
    
    // Đồng bộ dean_id khi thay đổi faculty_id hoặc management_positions
    const newFacultyId = updateData.faculty_id !== undefined ? updateData.faculty_id : oldFacultyId;
    const newManagementPositions = updateData.management_positions !== undefined 
      ? updateData.management_positions 
      : oldManagementPositions;
    
    if ((newFacultyId !== oldFacultyId || newManagementPositions !== oldManagementPositions) && newFacultyId) {
      await syncDeanFromEmployee(employee.id, newFacultyId, newManagementPositions);
    }
    
    const updatedEmployee = await Employee.findByPk(req.params.id, {
      include: [
        { model: Department, attributes: ['id', 'department_name', 'department_code'] },
        { model: Position, attributes: ['id', 'position_name', 'position_code', 'level'] },
        { model: Faculty, as: 'Faculty', attributes: ['id', 'faculty_code', 'faculty_name'] }
      ]
    });
    
    const mappedEmployee = mapEmployeeToUser(updatedEmployee);
    res.json(mappedEmployee);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật người dùng");
  }
};

export const deleteUser = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    await employee.destroy();
    res.json({ message: "Xóa người dùng thành công" });
  } catch (error) {
    handleError(res, error, "Không thể xóa người dùng");
  }
};

// ===================== Dashboard =====================
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalEmployees, totalDepartments, totalCourses, totalEnrollments,
      totalMajors, totalCohorts, totalKnowledgeBlocks, totalPositions,
      activeEmployees, activeCohorts, completedCohorts
    ] = await Promise.all([
      safeCount(Employee),
      safeCount(Department),
      safeCount(Course),
      safeCount(Enrollment),
      safeCount(Major),
      safeCount(Cohort),
      safeCount(KnowledgeBlock),
      safeCount(Position),
      safeCount(Employee, { where: { status: 'Active' } }),
      safeCount(Cohort, { where: { status: 'active' } }),
      safeCount(Cohort, { where: { status: 'completed' } })
    ]);

    res.json({
      totalEmployees,
      totalDepartments,
      totalCourses,
      totalEnrollments,
      totalMajors,
      totalCohorts,
      totalKnowledgeBlocks,
      totalPositions,
      activeEmployees,
      activeCohorts,
      completedCohorts
    });
  } catch (error) {
    res.status(500).json({ error: "Không thể tải thống kê dashboard" });
  }
};

// ===================== Tuition =====================
export const getTuitionByProgramId = async (req, res) => {
  try {
    const programId = req.params.id;
    const priceParam = req.query.price_per_credit ?? req.query.pricePerCredit;

    const program = await Program.findByPk(programId);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình đào tạo" });
    }

    let pricePerCredit = null;
    if (program.price_per_credit && Number(program.price_per_credit) > 0) {
      pricePerCredit = Number(program.price_per_credit);
    } else if (priceParam !== undefined && priceParam !== null && priceParam !== '') {
      pricePerCredit = Number(priceParam);
      if (!Number.isFinite(pricePerCredit) || pricePerCredit <= 0) {
        return res.status(400).json({ error: "Giá tín chỉ phải là số dương" });
      }
    } else {
      return res.status(400).json({ error: "Chương trình đào tạo chưa có giá tín chỉ. Vui lòng cung cấp giá tín chỉ hoặc cập nhật giá tín chỉ cho chương trình." });
    }

    const tongSoTinChi = Number(program.total_credits) || 0;
    if (tongSoTinChi <= 0) {
      return res.status(400).json({ error: "Chương trình đào tạo chưa có tổng số tín chỉ. Vui lòng cập nhật tổng số tín chỉ cho chương trình." });
    }

    const tongHocPhi = tongSoTinChi * pricePerCredit;

    res.json({
      program_id: program.id,
      program_code: program.program_code,
      program_name: program.program_name,
      price_per_credit: pricePerCredit,
      tongHocPhi,
      tongSoTinChi
    });
  } catch (error) {
    handleError(res, error, "Không thể tính học phí");
  }
};

export const updateProgramPrice = async (req, res) => {
  try {
    const program = await Program.findByPk(req.params.id);
    if (!program) {
      return res.status(404).json({ error: "Không tìm thấy chương trình" });
    }

    const { price_per_credit } = req.body;
    if (price_per_credit === undefined || price_per_credit === null || price_per_credit === '') {
      return res.status(400).json({ error: "Vui lòng cung cấp giá tín chỉ" });
    }

    const normalizedPrice = Number(price_per_credit);
    if (!Number.isFinite(normalizedPrice) || normalizedPrice < 0) {
      return res.status(400).json({ error: "Giá tín chỉ phải là số dương" });
    }

    await program.update({ price_per_credit: normalizedPrice });
    res.json(program);
  } catch (error) {
    handleError(res, error, "Không thể cập nhật giá tín chỉ");
  }
};

export const getMajorTuition = async (req, res) => {
  try {
    const majorId = req.params.id;
    const major = await Major.findByPk(majorId, {
      include: [{
        model: Program,
        as: "Programs",
        where: { is_active: true },
        required: false
      }]
    });

    if (!major) {
      return res.status(404).json({ error: "Không tìm thấy ngành học" });
    }

    const programs = major.Programs || [];
    if (programs.length === 0) {
      return res.json({
        major_id: major.id,
        major_code: major.major_code,
        major_name: major.major_name,
        total_programs: 0,
        tongHocPhiToiThieu: 0,
        tongSoTinChi: 0,
        programs: []
      });
    }

    let tongHocPhiToiThieu = 0;
    let tongSoTinChi = 0;
    const programDetails = [];

    programs.forEach(program => {
      const totalCredits = Number(program.total_credits) || 0;
      const pricePerCredit = Number(program.price_per_credit) || 0;
      if (totalCredits > 0 && pricePerCredit > 0) {
        const hocPhi = totalCredits * pricePerCredit;
        tongHocPhiToiThieu += hocPhi;
        tongSoTinChi += totalCredits;
        programDetails.push({
          program_id: program.id,
          program_code: program.program_code,
          program_name: program.program_name,
          total_credits: totalCredits,
          price_per_credit: pricePerCredit,
          hoc_phi: hocPhi
        });
      }
    });

    res.json({
      major_id: major.id,
      major_code: major.major_code,
      major_name: major.major_name,
      total_programs: programs.length,
      tongHocPhiToiThieu,
      tongSoTinChi,
      programs: programDetails
    });
  } catch (error) {
    handleError(res, error, "Không thể tính học phí tối thiểu của ngành");
  }
};

export const getMajorTuitionByYears = async (req, res) => {
  try {
    const majorId = req.params.id;
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
    
    const major = await Major.findByPk(majorId, {
      include: [{
        model: Program,
        as: "Programs",
        where: { is_active: true },
        required: false
      }]
    });

    if (!major) {
      return res.status(404).json({ error: "Không tìm thấy ngành học" });
    }

    const programs = major.Programs || [];
    const programsByYear = {};
    years.forEach(year => {
      programsByYear[year] = [];
    });

    programs.forEach(program => {
      let programYear = null;
      // Ưu tiên sử dụng start_year
      if (program.start_year) {
        programYear = Number(program.start_year);
      } else if (program.start_date) {
        const startDate = new Date(program.start_date);
        programYear = startDate.getFullYear();
      } else if (program.end_date) {
        const endDate = new Date(program.end_date);
        programYear = endDate.getFullYear();
      }
      if (programYear && years.includes(programYear)) {
        if (!programsByYear[programYear]) {
          programsByYear[programYear] = [];
        }
        programsByYear[programYear].push(program);
      }
    });

    const tuitionByYears = years.map(year => {
      const yearPrograms = programsByYear[year] || [];
      let tongHocPhiToiThieu = 0;
      let tongSoTinChi = 0;
      const programDetails = [];

      yearPrograms.forEach(program => {
        const totalCredits = Number(program.total_credits) || 0;
        const pricePerCredit = Number(program.price_per_credit) || 0;
        if (totalCredits > 0 && pricePerCredit > 0) {
          const hocPhi = totalCredits * pricePerCredit;
          tongHocPhiToiThieu += hocPhi;
          tongSoTinChi += totalCredits;
          programDetails.push({
            program_id: program.id,
            program_code: program.program_code,
            program_name: program.program_name,
            total_credits: totalCredits,
            price_per_credit: pricePerCredit,
            hoc_phi: hocPhi,
            start_date: program.start_date,
            end_date: program.end_date
          });
        }
      });

      return {
        year,
        total_programs: yearPrograms.length,
        tongHocPhiToiThieu,
        tongSoTinChi,
        programs: programDetails
      };
    });

    res.json({
      major_id: major.id,
      major_code: major.major_code,
      major_name: major.major_name,
      years: tuitionByYears
    });
  } catch (error) {
    handleError(res, error, "Không thể tính học phí tối thiểu của ngành theo năm");
  }
};

export const getMajorsWithLatestYearPrograms = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const majors = await Major.findAll({
      include: [{
        model: Program,
        as: "Programs",
        where: { 
          is_active: true 
        },
        required: false,
        attributes: ["id", "program_code", "program_name", "start_year", "total_credits", "price_per_credit", "start_date", "end_date"]
      }],
      order: [['created_at', 'DESC']]
    });

    const result = majors.map(major => {
      const programs = major.Programs || [];
      
      // Tìm năm mới nhất từ start_year của các programs
      let latestYear = null;
      programs.forEach(program => {
        let programYear = null;
        if (program.start_year) {
          programYear = Number(program.start_year);
        } else if (program.start_date) {
          const startDate = new Date(program.start_date);
          programYear = startDate.getFullYear();
        }
        if (programYear && (latestYear === null || programYear > latestYear)) {
          latestYear = programYear;
        }
      });

      // Lọc các programs có start_year = năm mới nhất
      const latestYearPrograms = programs.filter(program => {
        let programYear = null;
        if (program.start_year) {
          programYear = Number(program.start_year);
        } else if (program.start_date) {
          const startDate = new Date(program.start_date);
          programYear = startDate.getFullYear();
        }
        return programYear === latestYear;
      });

      return {
        id: major.id,
        major_code: major.major_code,
        major_name: major.major_name,
        latest_year: latestYear,
        programs: latestYearPrograms.map(p => ({
          id: p.id,
          program_code: p.program_code,
          program_name: p.program_name,
          start_year: p.start_year,
          total_credits: p.total_credits,
          price_per_credit: p.price_per_credit,
          start_date: p.start_date,
          end_date: p.end_date
        }))
      };
    });

    res.json(result);
  } catch (error) {
    handleError(res, error, "Không thể tải danh sách ngành với chương trình đào tạo");
  }
};

