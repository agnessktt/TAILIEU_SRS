-- Migration: add salary_coefficient and salary_level columns to employees
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20251118_add_salary_fields_to_employees.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Thêm cột salary_coefficient vào bảng employees
ALTER TABLE employees ADD COLUMN salary_coefficient DECIMAL(5, 2);

-- Thêm cột salary_level vào bảng employees
ALTER TABLE employees ADD COLUMN salary_level INTEGER;

COMMIT;
PRAGMA foreign_keys = ON;

