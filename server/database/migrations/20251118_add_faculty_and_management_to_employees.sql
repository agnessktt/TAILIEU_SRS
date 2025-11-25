-- Migration: add faculty_id and management_positions columns to employees
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20251118_add_faculty_and_management_to_employees.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Thêm cột faculty_id vào bảng employees
ALTER TABLE employees ADD COLUMN faculty_id INTEGER;

-- Thêm cột management_positions vào bảng employees
ALTER TABLE employees ADD COLUMN management_positions TEXT;

-- Thêm index cho faculty_id
CREATE INDEX IF NOT EXISTS idx_employees_faculty_id ON employees(faculty_id);

COMMIT;
PRAGMA foreign_keys = ON;

