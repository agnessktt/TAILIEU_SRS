-- Migration: allow NULL department_id in employees
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20250121_allow_null_department_id_in_employees.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

CREATE TABLE employees_new AS
SELECT
  id,
  employee_code,
  first_name,
  last_name,
  email,
  phone,
  address,
  date_of_birth,
  gender,
  degree,
  employee_type,
  id_card,
  position_id,
  department_id,
  manager_id,
  hire_date,
  salary,
  salary_coefficient,
  salary_level,
  status,
  faculty_id,
  management_positions,
  avatar_url,
  created_at,
  updated_at
FROM employees;

DROP TABLE employees;

CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_code VARCHAR(20) NOT NULL UNIQUE,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  date_of_birth DATE,
  gender VARCHAR(10) DEFAULT 'Other',
  degree VARCHAR(50),
  employee_type VARCHAR(20) NOT NULL DEFAULT 'staff',
  id_card VARCHAR(20) UNIQUE,
  position_id INTEGER NOT NULL,
  department_id INTEGER,
  manager_id INTEGER,
  hire_date DATE NOT NULL,
  salary DECIMAL(12, 2),
  salary_coefficient DECIMAL(5, 2),
  salary_level INTEGER,
  status VARCHAR(20) DEFAULT 'Active',
  faculty_id INTEGER,
  management_positions TEXT,
  avatar_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (position_id) REFERENCES positions(id),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL ON UPDATE CASCADE,
  FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO employees (
  id, employee_code, first_name, last_name, email, phone, address,
  date_of_birth, gender, degree, employee_type, id_card, position_id,
  department_id, manager_id, hire_date, salary, salary_coefficient,
  salary_level, status, faculty_id, management_positions, avatar_url,
  created_at, updated_at
)
SELECT
  id, employee_code, first_name, last_name, email, phone, address,
  date_of_birth, gender, degree, employee_type, id_card, position_id,
  department_id, manager_id, hire_date, salary, salary_coefficient,
  salary_level, status, faculty_id, management_positions, avatar_url,
  created_at, updated_at
FROM employees_new;

DROP TABLE employees_new;

COMMIT;
PRAGMA foreign_keys = ON;

