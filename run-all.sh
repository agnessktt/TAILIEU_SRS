#!/bin/bash
# Script to run both frontend (Vite) and backend (Node.js) concurrently

# Start backend
cd server && node server.js &
BACKEND_PID=$!
cd ..

# Start frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both to finish
wait $BACKEND_PID
wait $FRONTEND_PID
