-- Migration: add major_id column to cohorts
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20251118_add_major_id_to_cohorts.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- Thêm cột major_id vào bảng cohorts
ALTER TABLE cohorts ADD COLUMN major_id INTEGER;

-- Thêm foreign key constraint (SQLite không hỗ trợ ALTER TABLE ADD CONSTRAINT, nên chỉ tạo index)
CREATE INDEX IF NOT EXISTS idx_cohorts_major_id ON cohorts(major_id);

COMMIT;
PRAGMA foreign_keys = ON;

