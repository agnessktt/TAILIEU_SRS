-- Migration: add department_type column to departments
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20250121_add_department_type_to_departments.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

ALTER TABLE departments ADD COLUMN department_type TEXT DEFAULT 'department';

COMMIT;
PRAGMA foreign_keys = ON;

