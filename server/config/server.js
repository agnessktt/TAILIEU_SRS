export const PORT = 8000;

export const corsOptions = {
  origin: [
    "http://localhost:3000", // Vite dev server default
    "http://localhost:3001", // Custom port nếu có
    "http://localhost:3002", // Additional port
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:3002",
    "http://127.0.0.1:3003"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

