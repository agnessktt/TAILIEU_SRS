// server/server.js - Refactored version
import express from "express";
import { PORT } from "./config/server.js";
import { corsMiddleware, bodyParserJson, bodyParserUrlencoded, requestLogger } from "./middlewares/index.js";
import routes from "./routes/routes.js";
import { initializeServer } from "./utils/initServer.js";

const app = express();

// =======================
// Middleware
// =======================
app.use(corsMiddleware);
app.use(bodyParserJson);
app.use(bodyParserUrlencoded);
app.use(requestLogger);

// =======================
// Routes
// =======================
app.use("/api", routes);

// =======================
// Error Handling Middleware
// =======================
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] Unhandled error:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });
  
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path
  });
});

// =======================
// Initialize and start server
// =======================
async function startServer() {
  try {
    console.log("[SERVER] Starting server initialization...");
    await initializeServer();
    console.log("[SERVER] Server initialization completed");

    app.listen(PORT, () => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] 🚀 Server started successfully at http://localhost:${PORT}`);
      console.log(`[${timestamp}] 📍 Health check: http://localhost:${PORT}/api/health`);
      console.log(`[${timestamp}] 📍 Departments API: http://localhost:${PORT}/api/departments`);
    });
  } catch (error) {
    console.error("❌ [SERVER] Failed to start server:", error);
    console.error("❌ [SERVER] Error stack:", error.stack);
    process.exit(1);
  }
}

startServer();
