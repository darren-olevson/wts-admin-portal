# WTS Admin Portal - Quick Start

## ✅ Code Issues Fixed

All compilation errors have been resolved:
- ✅ StatusFunnel component - no duplicate declarations
- ✅ AccountOverview component - correct imports
- ✅ AgedWithdrawalQueue component - fixed
- ✅ Vite cache cleared

## 🚀 Starting the Portal

### Option 1: Manual Start (Recommended)

1. **Stop any running servers** in your terminals (press `Ctrl+C`)

2. **Start Backend Server** (Terminal 1):
   ```bash
   cd /Users/darrenolevson/cursor-playground/wts-admin-portal/server
   npm run dev
   ```
   
   Wait for: `WTS Admin Portal server running on port 3001`

3. **Start Frontend Client** (Terminal 2):
   ```bash
   cd /Users/darrenolevson/cursor-playground/wts-admin-portal/client
   npm run dev
   ```
   
   Wait for: `VITE v7.x.x ready` and `Local: http://localhost:3000/`

4. **Open Your Browser**:
   ```
   http://localhost:3000/
   ```

### Option 2: Using the Restart Script

```bash
cd /Users/darrenolevson/cursor-playground/wts-admin-portal
./restart-servers.sh
```

Then follow the instructions printed by the script.

## 🎯 What You'll See

The portal will load with:
- 📊 **Dashboard** - Withdrawal KPIs and metrics
- 💰 **Withdrawals** - List and detail pages
- 👥 **User Search** - Search and user details
- 📄 **Documents** - Tax documents management

## 🔧 Troubleshooting

### If the frontend won't load:

1. Clear the Vite cache:
   ```bash
   cd client
   rm -rf node_modules/.vite
   npm run dev
   ```

2. Check for port conflicts:
   ```bash
   lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
   lsof -ti:3001 | xargs kill -9  # Kill process on port 3001
   ```

### If you see "localhost sent an invalid response":

- You're trying to access the API directly (`http://localhost:3001/api`)
- Use the frontend instead: `http://localhost:3000/`

### If you see compilation errors:

- The errors are from old cached builds
- Stop the server (`Ctrl+C`) and restart with the steps above

## 📝 Current Status

- ✅ All code errors fixed
- ✅ Harbor API integration complete (using mock data by default)
- ✅ Type definitions updated
- ✅ Client and server in sync

## 🔐 Harbor API Integration

Currently running with **mock data** for development.

To enable real Harbor API:
1. Update `server/.env`:
   ```env
   USE_HARBOR_API=true
   HARBOR_BASE_URL=https://bo-api.development.wedbush.tech/client-account/v1
   HARBOR_API_KEY=your-api-key
   ```
2. Restart the backend server

See `docs/HARBOR_API_MAPPING.md` for complete API documentation.
