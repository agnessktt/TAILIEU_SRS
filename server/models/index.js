import sequelize, { DataTypes } from "../config/database.js";
import Faculty from "./Faculty.js";

// =======================
// Models - ENHANCED WITH STATUS
// =======================
const Department = sequelize.define("Department", {
  department_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 20]
    }
  },
  department_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  department_type: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: 'department',
    validate: {
      isIn: [['school', 'department']]
    }
  },
  parent_department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "departments",
  timestamps: true,
  underscored: true
});

const Position = sequelize.define("Position", {
  position_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  position_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "positions",
  timestamps: true,
  underscored: true
});

const Employee = sequelize.define("Employee", {
  employee_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  address: {
    type: DataTypes.TEXT
  },
  date_of_birth: {
    type: DataTypes.DATEONLY
  },
  gender: {
    type: DataTypes.STRING(10),
    defaultValue: 'Other'
  },
  degree: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  employee_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'staff',
    validate: {
      isIn: [['lecturer', 'staff']]
    }
  },
  id_card: {
    type: DataTypes.STRING(20),
    unique: true
  },
  position_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  hire_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  salary: {
    type: DataTypes.DECIMAL(12, 2)
  },
  salary_coefficient: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true
  },
  salary_level: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'Active'
  },
  faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  management_positions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "employees",
  timestamps: true,
  underscored: true
});

const CourseCategory = sequelize.define("CourseCategory", {
  category_code: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 20] },
  },
  category_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: { notEmpty: true, len: [1, 255] },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: "course_categories",
  timestamps: true,
  underscored: true
});

const Course = sequelize.define("Course", {
  course_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  course_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: DataTypes.TEXT,
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  duration_hours: DataTypes.INTEGER,
  total_credits: DataTypes.INTEGER,
  theory_credits: DataTypes.INTEGER,
  practice_credits: DataTypes.INTEGER,
  level: {
    type: DataTypes.STRING(50),
    defaultValue: 'Beginner'
  },
  prerequisite_course_ids: DataTypes.TEXT,
  concurrent_course_ids: DataTypes.TEXT,
  learning_objectives: DataTypes.TEXT,
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  knowledge_block_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
}, {
  tableName: "courses",
  timestamps: true,
  underscored: true
});

const CourseSession = sequelize.define("CourseSession", {
  start_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false
  },
  max_participants: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'scheduled',
    validate: {
      isIn: [['scheduled', 'in_progress', 'completed', 'cancelled']]
    }
  }
}, {
  tableName: "course_sessions",
  timestamps: true,
  underscored: true
});

const Enrollment = sequelize.define("Enrollment", {
  status: {
    type: DataTypes.STRING(20),
    defaultValue: "pending",
    validate: {
      isIn: [['pending', 'approved', 'rejected', 'completed']]
    }
  },
  enrolled_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: "enrollments",
  timestamps: true,
  underscored: true
});

const Cohort = sequelize.define("Cohort", {
  cohort_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  cohort_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  max_students: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  current_students: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'planning',
    validate: {
      isIn: [['planning', 'active', 'completed', 'cancelled']]
    }
  },
  program_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  major_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  instructor_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "cohorts",
  timestamps: true,
  underscored: true
});

const Major = sequelize.define("Major", {
  major_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  major_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  degree_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'bachelor',
    validate: {
      isIn: [['associate', 'bachelor', 'master', 'doctorate']]
    }
  },
  duration_years: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  total_credits: {
    type: DataTypes.INTEGER,
    defaultValue: 120
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  head_of_major_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  faculty_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "majors",
  timestamps: true,
  underscored: true
});

const KnowledgeBlock = sequelize.define("KnowledgeBlock", {
  block_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  block_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  total_credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  min_credits: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  max_credits: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  major_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "knowledge_blocks",
  timestamps: true,
  underscored: true
});

const CurriculumStructure = sequelize.define("CurriculumStructure", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  program_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  major_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  knowledge_block_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  min_credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "curriculum_structures",
  timestamps: true,
  underscored: true
});

const Program = sequelize.define("Program", {
  program_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  program_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  start_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 2000,
      max: new Date().getFullYear()
    }
  },
  total_credits: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
    validate: {
      min: 0
    }
  },
  price_per_credit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    defaultValue: null,
    validate: {
      min: 0
    }
  },
  major_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "majors",
      key: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "programs",
  timestamps: true,
  underscored: true
});

const ProgramCourse = sequelize.define("ProgramCourse", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  program_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "programs",
      key: "id"
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "courses",
      key: "id"
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE"
  },
  course_type: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  semester: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  knowledge_block_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "knowledge_blocks",
      key: "id"
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  }
}, {
  tableName: "program_courses",
  timestamps: true,
  underscored: true
});

const ProgramTuitionYear = sequelize.define("ProgramTuitionYear", {
  year: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  total_credits: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tuition_paid: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  tuition_remaining: {
    type: DataTypes.DECIMAL(14, 2),
    defaultValue: 0
  },
  program_count: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: "program_tuition_years",
  timestamps: true,
  underscored: true
});

// =======================
// Associations
// =======================

// Department – Position – Employee
Department.hasMany(Position, { foreignKey: 'department_id' });
Position.belongsTo(Department, { foreignKey: 'department_id' });

Department.hasMany(Employee, { foreignKey: 'department_id' });
Employee.belongsTo(Department, { foreignKey: 'department_id' });

Position.hasMany(Employee, { foreignKey: 'position_id' });
Employee.belongsTo(Position, { foreignKey: 'position_id' });

// Course relations
CourseCategory.hasMany(Course, { foreignKey: 'category_id' });
Course.belongsTo(CourseCategory, { foreignKey: 'category_id', as: 'CourseCategory' });
Course.belongsTo(Department, { foreignKey: 'department_id', as: 'Department' });
Course.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'Faculty' });
Course.belongsTo(Employee, { foreignKey: 'created_by', as: 'CreatedBy' });

Course.hasMany(CourseSession, { foreignKey: 'course_id' });
CourseSession.belongsTo(Course, { foreignKey: 'course_id' });

Employee.hasMany(Enrollment, { foreignKey: 'employee_id' });
Enrollment.belongsTo(Employee, { foreignKey: 'employee_id' });

CourseSession.hasMany(Enrollment, { foreignKey: 'course_session_id' });
Enrollment.belongsTo(CourseSession, { foreignKey: 'course_session_id' });

// Program – Cohort – Employee
Program.hasMany(Cohort, { foreignKey: 'program_id' });
Cohort.belongsTo(Program, { foreignKey: 'program_id', as: 'Program' });

Major.hasMany(Cohort, { foreignKey: 'major_id', as: 'Cohorts' });
Cohort.belongsTo(Major, { foreignKey: 'major_id', as: 'Major' });

Employee.hasMany(Cohort, { foreignKey: 'instructor_id' });
Cohort.belongsTo(Employee, { foreignKey: 'instructor_id', as: 'Instructor' });

Program.belongsToMany(KnowledgeBlock, { through: 'program_knowledge_blocks', foreignKey: 'program_id', otherKey: 'knowledge_block_id' });
KnowledgeBlock.belongsToMany(Program, { through: 'program_knowledge_blocks', foreignKey: 'knowledge_block_id', otherKey: 'program_id' });

Program.belongsToMany(Course, { through: ProgramCourse, as: 'Courses', foreignKey: 'program_id', otherKey: 'course_id' });
Course.belongsToMany(Program, { through: ProgramCourse, as: 'Programs', foreignKey: 'course_id', otherKey: 'program_id' });
Program.hasMany(ProgramCourse, { foreignKey: 'program_id', as: 'ProgramCourses' });
ProgramCourse.belongsTo(Program, { foreignKey: 'program_id' });
Course.hasMany(ProgramCourse, { foreignKey: 'course_id', as: 'ProgramCourses' });
ProgramCourse.belongsTo(Course, { foreignKey: 'course_id' });
ProgramCourse.belongsTo(KnowledgeBlock, { foreignKey: 'knowledge_block_id', as: 'KnowledgeBlock' });

Program.hasMany(ProgramTuitionYear, { foreignKey: 'program_id', as: 'TuitionYears' });
ProgramTuitionYear.belongsTo(Program, { foreignKey: 'program_id' });

// Department – Major – Employee
Department.hasMany(Major, { foreignKey: 'department_id' });
Major.belongsTo(Department, { foreignKey: 'department_id', as: 'Department' });

Employee.hasMany(Major, { foreignKey: 'head_of_major_id' });
Major.belongsTo(Employee, { foreignKey: 'head_of_major_id', as: 'HeadOfMajor' });

// Major – KnowledgeBlock
Major.hasMany(KnowledgeBlock, { foreignKey: 'major_id', as: 'KnowledgeBlocks' });
KnowledgeBlock.belongsTo(Major, { foreignKey: 'major_id', as: 'Major' });

// Major – Program
Major.hasMany(Program, { foreignKey: 'major_id', as: 'Programs' });
Program.belongsTo(Major, { foreignKey: 'major_id', as: 'Major' });

// KnowledgeBlock – Course
KnowledgeBlock.hasMany(Course, { foreignKey: 'knowledge_block_id', as: 'Courses' });
Course.belongsTo(KnowledgeBlock, { foreignKey: 'knowledge_block_id', as: 'KnowledgeBlock' });

// Program – CurriculumStructure
Program.hasMany(CurriculumStructure, { foreignKey: 'program_id', as: 'CurriculumStructures' });
CurriculumStructure.belongsTo(Program, { foreignKey: 'program_id', as: 'Program' });

// Major – CurriculumStructure
Major.hasMany(CurriculumStructure, { foreignKey: 'major_id', as: 'CurriculumStructures' });
CurriculumStructure.belongsTo(Major, { foreignKey: 'major_id', as: 'Major' });

// KnowledgeBlock – CurriculumStructure
KnowledgeBlock.hasMany(CurriculumStructure, { foreignKey: 'knowledge_block_id', as: 'CurriculumStructures' });
CurriculumStructure.belongsTo(KnowledgeBlock, { foreignKey: 'knowledge_block_id', as: 'KnowledgeBlock' });

// Course – CurriculumStructure
Course.hasMany(CurriculumStructure, { foreignKey: 'course_id', as: 'CurriculumStructures' });
CurriculumStructure.belongsTo(Course, { foreignKey: 'course_id', as: 'Course' });

CurriculumStructure.associate = (models) => {
  CurriculumStructure.belongsTo(models.Program, { foreignKey: 'program_id' });
  CurriculumStructure.belongsTo(models.Major, { foreignKey: 'major_id' });
  CurriculumStructure.belongsTo(models.KnowledgeBlock, { foreignKey: 'knowledge_block_id' });
  CurriculumStructure.belongsTo(models.Course, { foreignKey: 'course_id' });
};

// Faculty – Dean (Employee)
Employee.hasMany(Faculty, { foreignKey: 'dean_id', as: 'ManagedFaculties' });
Faculty.belongsTo(Employee, { foreignKey: 'dean_id', as: 'Dean' });

// Faculty – Department (Đơn vị trực thuộc)
Faculty.belongsTo(Department, { foreignKey: 'department_id', as: 'Department' });
Department.hasMany(Faculty, { foreignKey: 'department_id', as: 'Faculties' });

// Employee – Faculty (Khoa công tác)
Faculty.hasMany(Employee, { foreignKey: 'faculty_id', as: 'Employees' });
Employee.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'Faculty' });

// Faculty – Major
Faculty.hasMany(Major, { foreignKey: 'faculty_id', as: 'Majors' });
Major.belongsTo(Faculty, { foreignKey: 'faculty_id', as: 'Faculty' });

export {
  Department,
  Position,
  Employee,
  CourseCategory,
  Course,
  CourseSession,
  Enrollment,
  Cohort,
  Major,
  KnowledgeBlock,
  CurriculumStructure,
  Program,
  ProgramCourse,
  ProgramTuitionYear,
  Faculty
};

