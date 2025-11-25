-- Migration: add missing columns to faculties table
-- Usage (Windows PowerShell):
--   sqlite3 database/training.sqlite ".read server/database/migrations/20251117_add_faculty_columns.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

-- NOTE: SQLite lacks IF NOT EXISTS for ADD COLUMN, so run each statement once.
-- If you already ran this migration, ignore the resulting "duplicate column" errors.

ALTER TABLE faculties ADD COLUMN established_date TEXT;
ALTER TABLE faculties ADD COLUMN dean_id INTEGER;
ALTER TABLE faculties ADD COLUMN contact_email TEXT;
ALTER TABLE faculties ADD COLUMN contact_phone TEXT;
ALTER TABLE faculties ADD COLUMN department_list TEXT;

COMMIT;
PRAGMA foreign_keys = ON;

