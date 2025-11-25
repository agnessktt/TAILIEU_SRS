-- Migration: prevent deleting departments that still have related data
-- Usage:
--   cd C:\YCPM\training-management
--   sqlite3 database/training.sqlite ".read server/database/migrations/20250121_prevent_delete_department_with_relations.sql"

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

DROP TRIGGER IF EXISTS prevent_department_delete_with_faculties;
DROP TRIGGER IF EXISTS prevent_department_delete_with_positions;
DROP TRIGGER IF EXISTS prevent_department_delete_with_employees;

CREATE TRIGGER prevent_department_delete_with_faculties
BEFORE DELETE ON departments
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN (SELECT COUNT(*) FROM faculties WHERE department_id = OLD.id) > 0
      THEN RAISE(ABORT, 'Không thể xóa đơn vị vì đang có khoa trực thuộc')
    END;
END;

CREATE TRIGGER prevent_department_delete_with_positions
BEFORE DELETE ON departments
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN (SELECT COUNT(*) FROM positions WHERE department_id = OLD.id) > 0
      THEN RAISE(ABORT, 'Không thể xóa đơn vị vì đang có chức vụ trực thuộc')
    END;
END;

CREATE TRIGGER prevent_department_delete_with_employees
BEFORE DELETE ON departments
FOR EACH ROW
BEGIN
  SELECT
    CASE
      WHEN (SELECT COUNT(*) FROM employees WHERE department_id = OLD.id) > 0
      THEN RAISE(ABORT, 'Không thể xóa đơn vị vì đang có nhân sự trực thuộc')
    END;
END;

COMMIT;
PRAGMA foreign_keys = ON;

