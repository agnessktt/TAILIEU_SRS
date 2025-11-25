import {
  Department,
  Position,
  Employee,
  CourseCategory
} from "../models/index.js";

// Load sample data if tables are empty
export async function loadSampleData() {
  try {
    console.log("[DB] Checking for sample data...");

    // Check if we already have data
    const departmentCount = await Department.count();
    if (departmentCount > 0) {
      console.log("[DB] Sample data already exists, skipping...");
      return;
    }

    console.log("[DB] Loading sample data...");

    // Create course categories
    const courseCategories = await CourseCategory.bulkCreate([
      { category_code: 'TECH', category_name: 'Công nghệ thông tin', description: 'Các khóa học về công nghệ thông tin và lập trình' },
      { category_code: 'MANAGE', category_name: 'Quản lý', description: 'Các khóa học về kỹ năng quản lý và lãnh đạo' },
      { category_code: 'SOFT', category_name: 'Kỹ năng mềm', description: 'Các khóa học về kỹ năng giao tiếp và làm việc nhóm' },
      { category_code: 'LANG', category_name: 'Ngoại ngữ', description: 'Các khóa học về ngoại ngữ' }
    ]);

    // Create departments
    const departments = await Department.bulkCreate([
      { department_code: 'IT', department_name: 'Phòng Công nghệ thông tin', description: 'Phòng phụ trách về công nghệ thông tin' },
      { department_code: 'HR', department_name: 'Phòng Nhân sự', description: 'Phòng phụ trách về quản lý nhân sự' },
      { department_code: 'FIN', department_name: 'Phòng Tài chính', description: 'Phòng phụ trách về tài chính kế toán' },
      { department_code: 'MKT', department_name: 'Phòng Marketing', description: 'Phòng phụ trách về marketing và bán hàng' }
    ]);

    // Create positions
    const positions = await Position.bulkCreate([
      { position_code: 'DEV', position_name: 'Lập trình viên', level: 3, description: 'Phát triển phần mềm', department_id: 1 },
      { position_code: 'PM', position_name: 'Quản lý dự án', level: 4, description: 'Quản lý các dự án công nghệ', department_id: 1 },
      { position_code: 'HR_MGR', position_name: 'Trưởng phòng nhân sự', level: 5, description: 'Quản lý phòng nhân sự', department_id: 2 },
      { position_code: 'HR_SPEC', position_name: 'Chuyên viên nhân sự', level: 3, description: 'Chuyên viên phụ trách nhân sự', department_id: 2 },
      { position_code: 'ACCOUNTANT', position_name: 'Kế toán', level: 3, description: 'Kế toán viên', department_id: 3 },
      { position_code: 'MKT_MGR', position_name: 'Trưởng phòng marketing', level: 5, description: 'Quản lý phòng marketing', department_id: 4 }
    ]);

    // Create employees
    const employees = await Employee.bulkCreate([
      { employee_code: 'EMP001', first_name: 'Nguyễn Văn', last_name: 'An', email: 'an.nguyen@company.com', phone: '0123456789', position_id: 1, department_id: 1, hire_date: '2023-01-15', salary: 15000000, employee_type: 'staff' },
      { employee_code: 'EMP002', first_name: 'Trần Thị', last_name: 'Bình', email: 'binh.tran@company.com', phone: '0123456790', position_id: 2, department_id: 1, hire_date: '2022-06-01', salary: 20000000, employee_type: 'lecturer' },
      { employee_code: 'EMP003', first_name: 'Lê Văn', last_name: 'Cường', email: 'cuong.le@company.com', phone: '0123456791', position_id: 3, department_id: 2, hire_date: '2021-03-10', salary: 25000000, employee_type: 'lecturer' },
      { employee_code: 'EMP004', first_name: 'Phạm Thị', last_name: 'Dung', email: 'dung.pham@company.com', phone: '0123456792', position_id: 4, department_id: 2, hire_date: '2023-02-20', salary: 12000000, employee_type: 'staff' },
      { employee_code: 'EMP005', first_name: 'Hoàng Văn', last_name: 'Em', email: 'em.hoang@company.com', phone: '0123456793', position_id: 5, department_id: 3, hire_date: '2022-11-05', salary: 13000000, employee_type: 'staff' },
      { employee_code: 'EMP006', first_name: 'Vũ Thị', last_name: 'Phương', email: 'phuong.vu@company.com', phone: '0123456794', position_id: 6, department_id: 4, hire_date: '2021-08-15', salary: 22000000, employee_type: 'lecturer' },
    ]);

    // Update department managers
    await Department.update({ manager_id: 2 }, { where: { id: 1 } });
    await Department.update({ manager_id: 3 }, { where: { id: 2 } });
    await Department.update({ manager_id: 5 }, { where: { id: 3 } });
    await Department.update({ manager_id: 6 }, { where: { id: 4 } });

    console.log("✅ [DB] Sample data loaded successfully!");
  } catch (error) {
    console.error("❌ [DB] Failed to load sample data:", error.message);
  }
}

