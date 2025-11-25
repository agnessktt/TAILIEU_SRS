-- Migration: allow null department_id in positions table
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20250120_allow_null_department_id_in_positions.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- SQLite không hỗ trợ ALTER TABLE để thay đổi constraint NOT NULL trực tiếp
-- Nên ta cần tạo bảng mới, copy dữ liệu, drop bảng cũ, và rename

-- Tạo bảng positions mới với department_id cho phép null
CREATE TABLE positions_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  position_code VARCHAR(20) NOT NULL UNIQUE,
  position_name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  department_id INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME,
  updated_at DATETIME
);

-- Copy dữ liệu từ bảng cũ sang bảng mới
INSERT INTO positions_new 
  (id, position_code, position_name, level, description, department_id, is_active, created_at, updated_at)
SELECT 
  id, position_code, position_name, level, description, department_id, is_active, created_at, updated_at
FROM positions;

-- Drop bảng cũ
DROP TABLE positions;

-- Rename bảng mới thành positions
ALTER TABLE positions_new RENAME TO positions;

-- Tạo lại index nếu cần
CREATE INDEX IF NOT EXISTS idx_positions_department_id ON positions(department_id);

COMMIT;
PRAGMA foreign_keys = ON;

