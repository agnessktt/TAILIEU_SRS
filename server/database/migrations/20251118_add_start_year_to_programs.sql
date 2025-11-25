-- Migration: add start_year column to programs
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20251118_add_start_year_to_programs.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

ALTER TABLE programs ADD COLUMN start_year INTEGER;

COMMIT;
PRAGMA foreign_keys = ON;

