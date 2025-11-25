import { Sequelize, DataTypes } from "sequelize";
import fs from "fs";
import path from "path";

// Ensure database directory exists for SQLite file storage
const dbDirectory = path.join(process.cwd(), "database");
if (!fs.existsSync(dbDirectory)) {
  fs.mkdirSync(dbDirectory, { recursive: true });
}

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database/training.sqlite",
  logging: console.log,
});

// Test database connection
export async function testConnection() {
  try {
    console.log("[DB] Attempting to connect to SQLite database...")
    await sequelize.authenticate();

    // Enable useful SQLite PRAGMAs
    try {
      await sequelize.query('PRAGMA foreign_keys = ON');
      await sequelize.query('PRAGMA journal_mode = WAL');
      await sequelize.query('PRAGMA synchronous = NORMAL');
      console.log("✅ [DB] SQLite PRAGMAs enabled: foreign_keys, WAL, synchronous=NORMAL");
    } catch (pragmaErr) {
      console.warn("⚠️ [DB] Could not set SQLite PRAGMAs:", pragmaErr.message);
    }

    console.log("✅ [DB] SQLite connection established successfully!");
    return true;
  } catch (error) {
    console.error("❌ [DB] SQLite connection failed:", error.message);
    return false;
  }
}

export default sequelize;
export { DataTypes };

