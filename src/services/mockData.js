// Mock data cho development và testing
export const mockDepartments = [
  {
    id: 1,
    department_code: 'IT',
    department_name: 'Phòng Công nghệ thông tin',
    description: 'Phòng phụ trách về công nghệ thông tin',
    parent_department_id: null,
    manager_id: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true,
    manager_name: 'Trần Thị Bình'
  },
  {
    id: 2,
    department_code: 'HR',
    department_name: 'Phòng Nhân sự',
    description: 'Phòng phụ trách về quản lý nhân sự',
    parent_department_id: null,
    manager_id: 3,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true,
    manager_name: 'Lê Văn Cường'
  },
  {
    id: 3,
    department_code: 'FIN',
    department_name: 'Phòng Tài chính',
    description: 'Phòng phụ trách về tài chính kế toán',
    parent_department_id: null,
    manager_id: 5,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true,
    manager_name: 'Hoàng Văn Em'
  },
  {
    id: 4,
    department_code: 'MKT',
    department_name: 'Phòng Marketing',
    description: 'Phòng phụ trách về marketing và bán hàng',
    parent_department_id: null,
    manager_id: 6,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true,
    manager_name: 'Vũ Thị Phương'
  }
]

export const mockPositions = [
  {
    id: 1,
    position_code: 'DEV',
    position_name: 'Lập trình viên',
    level: 3,
    description: 'Phát triển phần mềm',
    department_id: 1,
    department_name: 'Phòng Công nghệ thông tin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 2,
    position_code: 'PM',
    position_name: 'Quản lý dự án',
    level: 4,
    description: 'Quản lý các dự án công nghệ',
    department_id: 1,
    department_name: 'Phòng Công nghệ thông tin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 3,
    position_code: 'HR_MGR',
    position_name: 'Trưởng phòng nhân sự',
    level: 5,
    description: 'Quản lý phòng nhân sự',
    department_id: 2,
    department_name: 'Phòng Nhân sự',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 4,
    position_code: 'HR_SPEC',
    position_name: 'Chuyên viên nhân sự',
    level: 3,
    description: 'Chuyên viên phụ trách nhân sự',
    department_id: 2,
    department_name: 'Phòng Nhân sự',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  }
]

export const mockEmployees = [
  {
    id: 1,
    employee_code: 'EMP001',
    first_name: 'Nguyễn Văn',
    last_name: 'An',
    full_name: 'Nguyễn Văn An',
    email: 'an.nguyen@company.com',
    phone: '0123456789',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    date_of_birth: '1990-01-15',
    gender: 'Male',
    id_card: '123456789',
    position_id: 1,
    position_name: 'Lập trình viên',
    department_id: 1,
    department_name: 'Phòng Công nghệ thông tin',
    manager_id: 2,
    manager_name: 'Trần Thị Bình',
    hire_date: '2023-01-15',
    salary: 15000000,
    status: 'Active',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    employee_code: 'EMP002',
    first_name: 'Trần Thị',
    last_name: 'Bình',
    full_name: 'Trần Thị Bình',
    email: 'binh.tran@company.com',
    phone: '0123456790',
    address: '456 Đường DEF, Quận 2, TP.HCM',
    date_of_birth: '1985-05-20',
    gender: 'Female',
    id_card: '987654321',
    position_id: 2,
    position_name: 'Quản lý dự án',
    department_id: 1,
    department_name: 'Phòng Công nghệ thông tin',
    manager_id: null,
    manager_name: null,
    hire_date: '2022-06-01',
    salary: 20000000,
    status: 'Active',
    created_at: '2022-06-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    employee_code: 'EMP003',
    first_name: 'Lê Văn',
    last_name: 'Cường',
    full_name: 'Lê Văn Cường',
    email: 'cuong.le@company.com',
    phone: '0123456791',
    address: '789 Đường GHI, Quận 3, TP.HCM',
    date_of_birth: '1980-03-10',
    gender: 'Male',
    id_card: '456789123',
    position_id: 3,
    position_name: 'Trưởng phòng nhân sự',
    department_id: 2,
    department_name: 'Phòng Nhân sự',
    manager_id: null,
    manager_name: null,
    hire_date: '2021-03-10',
    salary: 25000000,
    status: 'Active',
    created_at: '2021-03-10T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export const mockCourseCategories = [
  {
    id: 1,
    category_code: 'TECH',
    category_name: 'Công nghệ thông tin',
    description: 'Các khóa học về công nghệ thông tin và lập trình',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 2,
    category_code: 'MANAGE',
    category_name: 'Quản lý',
    description: 'Các khóa học về kỹ năng quản lý và lãnh đạo',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 3,
    category_code: 'SOFT',
    category_name: 'Kỹ năng mềm',
    description: 'Các khóa học về kỹ năng giao tiếp và làm việc nhóm',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 4,
    category_code: 'LANG',
    category_name: 'Ngoại ngữ',
    description: 'Các khóa học về ngoại ngữ',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  }
]

export const mockCourses = [
  {
    id: 1,
    course_code: 'JAVA101',
    course_name: 'Lập trình Java cơ bản',
    description: 'Khóa học lập trình Java từ cơ bản đến nâng cao',
    category_id: 1,
    category_name: 'Công nghệ thông tin',
    duration_hours: 40,
    credits: 3,
    level: 'Beginner',
    prerequisites: 'Không có',
    learning_objectives: 'Học lập trình Java',
    created_by: 1,
    created_by_name: 'Nguyễn Văn An',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 2,
    course_code: 'PM201',
    course_name: 'Quản lý dự án Agile',
    description: 'Phương pháp quản lý dự án theo mô hình Agile',
    category_id: 2,
    category_name: 'Quản lý',
    duration_hours: 24,
    credits: 2,
    level: 'Intermediate',
    prerequisites: 'Có kinh nghiệm quản lý cơ bản',
    learning_objectives: 'Học quản lý dự án Agile',
    created_by: 2,
    created_by_name: 'Trần Thị Bình',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 3,
    course_code: 'COMM101',
    course_name: 'Kỹ năng giao tiếp hiệu quả',
    description: 'Phát triển kỹ năng giao tiếp trong công việc',
    category_id: 3,
    category_name: 'Kỹ năng mềm',
    duration_hours: 16,
    credits: 1,
    level: 'Beginner',
    prerequisites: 'Không có',
    learning_objectives: 'Cải thiện kỹ năng giao tiếp',
    created_by: 3,
    created_by_name: 'Lê Văn Cường',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    is_active: true
  }
]

export const mockCourseSessions = [
  {
    id: 1,
    session_code: 'JAVA101-2024-01',
    course_id: 1,
    course_name: 'Lập trình Java cơ bản',
    instructor_id: 1,
    instructor_name: 'Nguyễn Văn An',
    start_date: '2024-03-01',
    end_date: '2024-04-15',
    max_students: 25,
    current_students: 15,
    status: 'Ongoing',
    location: 'Phòng học A1',
    notes: 'Khóa học đang diễn ra',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    session_code: 'PM201-2024-01',
    course_id: 2,
    course_name: 'Quản lý dự án Agile',
    instructor_id: 2,
    instructor_name: 'Trần Thị Bình',
    start_date: '2024-03-15',
    end_date: '2024-04-30',
    max_students: 20,
    current_students: 18,
    status: 'Ongoing',
    location: 'Phòng học B2',
    notes: 'Khóa học đang diễn ra',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export const mockEnrollments = [
  {
    id: 1,
    employee_id: 1,
    employee_name: 'Nguyễn Văn An',
    course_session_id: 1,
    course_name: 'Lập trình Java cơ bản',
    enrollment_date: '2024-02-15T00:00:00Z',
    status: 'Enrolled',
    final_score: null,
    completion_date: null,
    notes: null,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z'
  },
  {
    id: 2,
    employee_id: 2,
    employee_name: 'Trần Thị Bình',
    course_session_id: 2,
    course_name: 'Quản lý dự án Agile',
    enrollment_date: '2024-02-20T00:00:00Z',
    status: 'Completed',
    final_score: 85.5,
    completion_date: '2024-04-30T00:00:00Z',
    notes: 'Hoàn thành xuất sắc',
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-04-30T00:00:00Z'
  }
]

export const mockStats = {
  totalDepartments: 4,
  totalEmployees: 150,
  totalCourses: 25,
  totalEnrollments: 320,
  activeCourses: 8,
  completedCourses: 45,
  upcomingCourses: 3
}
