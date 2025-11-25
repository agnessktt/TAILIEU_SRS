-- Migration: add faculty_id column to courses for faculty linkage
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20250121_add_faculty_id_to_courses.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

ALTER TABLE courses ADD COLUMN faculty_id INTEGER;

COMMIT;
PRAGMA foreign_keys = ON;

