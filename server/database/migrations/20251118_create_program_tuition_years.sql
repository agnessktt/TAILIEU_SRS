-- Migration: create program_tuition_years table
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20251118_create_program_tuition_years.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS program_tuition_years (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  program_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  total_credits INTEGER DEFAULT 0,
  tuition_paid REAL DEFAULT 0,
  tuition_remaining REAL DEFAULT 0,
  program_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_program_tuition_program_year
  ON program_tuition_years (program_id, year);

COMMIT;
PRAGMA foreign_keys = ON;

