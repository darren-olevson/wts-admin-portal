#!/bin/bash

echo "🧹 Cleaning up old processes..."

# Kill any existing node processes on ports 3000 and 3001
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "✨ Clearing Vite cache..."
rm -rf client/node_modules/.vite

echo "🚀 Starting servers..."
echo ""
echo "📝 Instructions:"
echo "1. Open TWO terminal windows"
echo "2. In Terminal 1, run: cd server && npm run dev"
echo "3. In Terminal 2, run: cd client && npm run dev"
echo "4. Wait for both to start, then visit http://localhost:3000"
echo ""
echo "✅ Cleanup complete! Follow the instructions above."
