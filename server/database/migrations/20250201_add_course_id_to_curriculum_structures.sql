PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

ALTER TABLE curriculum_structures
  ADD COLUMN course_id INTEGER REFERENCES courses(id);

COMMIT;
PRAGMA foreign_keys = ON;

