-- Migration: add faculty_id column to majors for faculty linkage
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20251117_add_faculty_id_to_majors.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

ALTER TABLE majors ADD COLUMN faculty_id INTEGER;

COMMIT;
PRAGMA foreign_keys = ON;

