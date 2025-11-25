import sequelize, { testConnection } from "../config/database.js";
import { applyDatabasePatches, backfillAllProgramsTotalCredits } from "./database.js";
import { loadSampleData } from "./sampleData.js";

export async function initializeServer() {
  console.log("[SERVER] Initializing server...");
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error("❌ [SERVER] Cannot start server due to database connection failure");
    process.exit(1);
  }

  try {
    // Clean up legacy data that might violate new validations/foreign keys
    try {
      console.log("[DB] Performing pre-sync data cleanup for curriculum structures...");
      await sequelize.query("DROP TABLE IF EXISTS departments_backup");
      await sequelize.query(`
        DELETE FROM curriculum_structures
        WHERE program_id IS NOT NULL
          AND (
            TRIM(CAST(program_id AS TEXT)) = ''
            OR program_id NOT IN (SELECT id FROM programs)
          )
      `);
      await sequelize.query(`
        DELETE FROM curriculum_structures
        WHERE major_id NOT IN (SELECT id FROM majors)
           OR knowledge_block_id NOT IN (SELECT id FROM knowledge_blocks)
      `);
      console.log("✅ [DB] Pre-sync cleanup completed");
    } catch (cleanupError) {
      console.warn("⚠️ [DB] Pre-sync cleanup skipped:", cleanupError.message);
    }

    console.log("[DB] Syncing database tables (with alter)...");
    await applyDatabasePatches();
    
    // Import models to ensure they are registered
    console.log("[DB] Loading models...");
    await import("../models/index.js");
    console.log("✅ [DB] Models loaded");
    
    await sequelize.sync(); // Đồng bộ cấu trúc bảng với model mới
    console.log("✅ [DB] Database tables synced successfully");

    await loadSampleData();
    await backfillAllProgramsTotalCredits();

    return true;
  } catch (error) {
    console.error("❌ [SERVER] Server startup failed:", error.message);
    if (error && Array.isArray(error.errors)) {
      console.error("🔍 [SERVER] Validation details:", error.errors.map(e => ({
        message: e.message,
        path: e.path,
        value: e.value
      })));
    } else if (error?.parent?.message) {
      console.error("🔍 [SERVER] Parent error:", error.parent.message);
    }
    throw error;
  }
}

