-- Migration: add department_id column to faculties
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20250119_add_department_id_to_faculties.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Thêm cột department_id vào bảng faculties
ALTER TABLE faculties ADD COLUMN department_id INTEGER;

-- Thêm foreign key constraint (SQLite không hỗ trợ ALTER TABLE ADD CONSTRAINT, nên chỉ tạo index)
CREATE INDEX IF NOT EXISTS idx_faculties_department_id ON faculties(department_id);

COMMIT;
PRAGMA foreign_keys = ON;

