import sequelize, { DataTypes } from "../config/database.js";
import { Program, KnowledgeBlock } from "../models/index.js";
import { Sequelize } from "sequelize";

// Recalculate total_credits for a single program based on linked KnowledgeBlocks
export async function recalculateProgramTotalCredits(programInstance) {
  try {
    const program = await Program.findByPk(programInstance.id, {
      include: [
        {
          model: KnowledgeBlock,
          attributes: ["id", "total_credits"],
          through: { attributes: [] }
        }
      ]
    });
    if (!program) return;
    const data = program.toJSON();
    const sum = Array.isArray(data.KnowledgeBlocks)
      ? data.KnowledgeBlocks.reduce((acc, kb) => acc + (Number(kb.total_credits) || 0), 0)
      : 0;
    await program.update({ total_credits: sum });
  } catch (e) {
    console.warn("⚠️ [DB] Failed to recalculate program total_credits:", e.message);
  }
}

// Recalculate total_credits for all programs (useful for backfilling existing data)
export async function backfillAllProgramsTotalCredits() {
  try {
    console.log("[DB] Backfilling total_credits for programs...");
    const allPrograms = await Program.findAll({ attributes: ["id"] });
    for (const p of allPrograms) {
      await recalculateProgramTotalCredits(p);
    }
    console.log("✅ [DB] Backfill total_credits completed");
  } catch (e) {
    console.warn("⚠️ [DB] Backfill total_credits failed:", e.message);
  }
}

export async function applyDatabasePatches() {
  const qi = sequelize.getQueryInterface();
  console.log("[DB] Applying database patches...");

  // Ensure employees table has degree column
  try {
    const employeeColumns = await qi.describeTable("employees");
    if (employeeColumns && !employeeColumns.degree) {
      console.log("[DB] Adding 'degree' column to employees...");
      await qi.addColumn("employees", "degree", {
        type: DataTypes.STRING(50),
        allowNull: true,
      });
      console.log("✅ [DB] Added 'degree' column to employees");
    }
  } catch (err) {
    console.warn("⚠️ [DB] Could not inspect/add columns to employees:", err.message);
  }

  // Ensure curriculum_structures has program_id column
  try {
    const csColumns = await qi.describeTable("curriculum_structures");
    if (csColumns && !csColumns.program_id) {
      console.log("[DB] Adding 'program_id' column to curriculum_structures...");
      await qi.addColumn("curriculum_structures", "program_id", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "programs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      console.log("✅ [DB] Added 'program_id' column to curriculum_structures");
    }
  } catch (err) {
    console.warn("⚠️ [DB] Could not inspect/add columns to curriculum_structures:", err.message);
  }

  // Ensure programs table has total_credits column
  try {
    const programColumns = await qi.describeTable("programs");
    if (programColumns && !programColumns.total_credits) {
      console.log("[DB] Adding 'total_credits' column to programs...");
      await qi.addColumn("programs", "total_credits", {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      });
      console.log("✅ [DB] Added 'total_credits' column to programs");
    }
    if (programColumns && !programColumns.price_per_credit) {
      console.log("[DB] Adding 'price_per_credit' column to programs...");
      await qi.addColumn("programs", "price_per_credit", {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: null,
      });
      console.log("✅ [DB] Added 'price_per_credit' column to programs");
    }
    if (programColumns && !programColumns.major_id) {
      console.log("[DB] Adding 'major_id' column to programs...");
      await qi.addColumn("programs", "major_id", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "majors",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      console.log("✅ [DB] Added 'major_id' column to programs");
    }
  } catch (err) {
    console.warn("⚠️ [DB] Could not inspect/add columns to programs:", err.message);
  }

  // Ensure program_courses join table exists
  try {
    const tables = await qi.showAllTables();
    const normalizedTables = Array.isArray(tables)
      ? tables
          .map((t) => {
            if (typeof t === "string") return t.toLowerCase();
            if (t && typeof t === "object") {
              if (typeof t.tableName === "string") return t.tableName.toLowerCase();
              if (typeof t.name === "string") return t.name.toLowerCase();
            }
            return "";
          })
          .filter(Boolean)
      : [];
    if (!normalizedTables.includes("program_courses")) {
      console.log("[DB] Creating 'program_courses' join table...");
      await qi.createTable("program_courses", {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        program_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "programs",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        course_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: "courses",
            key: "id",
          },
          onUpdate: "CASCADE",
          onDelete: "CASCADE",
        },
        course_type: {
          type: DataTypes.STRING(50),
          allowNull: true,
        },
        semester: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
      });
      await qi.addConstraint("program_courses", {
        type: "unique",
        fields: ["program_id", "course_id"],
        name: "program_courses_unique_program_course",
      });
      console.log("✅ [DB] Created 'program_courses' join table");
    } else {
      const programCourseColumns = await qi.describeTable("program_courses");
      if (programCourseColumns && !programCourseColumns.semester) {
        console.log("[DB] Adding 'semester' column to program_courses...");
        await qi.addColumn("program_courses", "semester", {
          type: DataTypes.INTEGER,
          allowNull: true,
        });
        console.log("✅ [DB] Added 'semester' column to program_courses");
      }
      if (programCourseColumns && !programCourseColumns.notes) {
        console.log("[DB] Adding 'notes' column to program_courses...");
        await qi.addColumn("program_courses", "notes", {
          type: DataTypes.TEXT,
          allowNull: true,
        });
        console.log("✅ [DB] Added 'notes' column to program_courses");
      }
      if (programCourseColumns && !programCourseColumns.course_type) {
        console.log("[DB] Adding 'course_type' column to program_courses...");
        await qi.addColumn("program_courses", "course_type", {
          type: DataTypes.STRING(50),
          allowNull: true,
        });
        console.log("✅ [DB] Added 'course_type' column to program_courses");
    }
    if (programCourseColumns && !programCourseColumns.knowledge_block_id) {
      console.log("[DB] Adding 'knowledge_block_id' column to program_courses...");
      await qi.addColumn("program_courses", "knowledge_block_id", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "knowledge_blocks",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      });
      console.log("✅ [DB] Added 'knowledge_block_id' column to program_courses");
      }
    }
  } catch (err) {
    console.warn("⚠️ [DB] Could not ensure program_courses table:", err.message);
  }

  // Ensure knowledge_blocks has credit range columns
  try {
    const knowledgeBlockColumns = await qi.describeTable("knowledge_blocks");
    if (knowledgeBlockColumns && !knowledgeBlockColumns.min_credits) {
      console.log("[DB] Adding 'min_credits' column to knowledge_blocks...");
      await qi.addColumn("knowledge_blocks", "min_credits", {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      });
      console.log("✅ [DB] Added 'min_credits' column to knowledge_blocks");
    }
    if (knowledgeBlockColumns && !knowledgeBlockColumns.max_credits) {
      console.log("[DB] Adding 'max_credits' column to knowledge_blocks...");
      await qi.addColumn("knowledge_blocks", "max_credits", {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      });
      console.log("✅ [DB] Added 'max_credits' column to knowledge_blocks");
    }
  } catch (err) {
    console.warn("⚠️ [DB] Could not inspect/add columns to knowledge_blocks:", err.message);
  }

  // Ensure faculties table has department_id column
  try {
    const facultyColumns = await qi.describeTable("faculties");
    if (facultyColumns && !facultyColumns.department_id) {
      console.log("[DB] Adding 'department_id' column to faculties...");
      await qi.addColumn("faculties", "department_id", {
        type: DataTypes.INTEGER,
        allowNull: true,
      });
      console.log("✅ [DB] Added 'department_id' column to faculties");
    }
  } catch (err) {
    console.warn("⚠️ [DB] Could not inspect/add columns to faculties:", err.message);
  }

  // Ensure positions table allows null department_id
  // Note: SQLite doesn't support ALTER TABLE to change NOT NULL constraint
  // So we check if the column exists and if it's already nullable
  // If not, we'll need to run the migration manually
  try {
    const positionColumns = await qi.describeTable("positions");
    if (positionColumns && positionColumns.department_id) {
      // Check if we need to allow null (this is a soft check - SQLite doesn't enforce NOT NULL strictly)
      // The model definition already allows null, so Sequelize will handle it
      // But we log a note for manual migration if needed
      console.log("[DB] positions.department_id exists - model allows null");
    }
  } catch (err) {
    console.warn("⚠️ [DB] Could not inspect positions table:", err.message);
  }
}

