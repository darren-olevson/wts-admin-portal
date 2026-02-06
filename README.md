# WTS Admin Portal

A unified dashboard for Ops, Compliance, and Support to manage Invest withdrawal issues and provide compliance document access.

## Implementation Status

### Phase 1: Project Setup & Foundation ✅ COMPLETED

**Project Structure**
- ✅ React + TypeScript client application with Vite
- ✅ Express + TypeScript server with API routes
- ✅ Basic routing and navigation structure
- ✅ Harbor API client foundation
- ✅ Type definitions for Harbor API
- ✅ Seasoned cash calculation utility
- ✅ Harbor data converters
- ✅ Authentication and RBAC middleware structure

### Harbor API Integration ✅ COMPLETED

**API Integration**
- ✅ Updated Harbor API type definitions (Payment Instructions, Clients, Accounts, Documents)
- ✅ Refactored HarborClient with actual API endpoints and flexible authentication
- ✅ Created data converters for Harbor → UI format transformations
- ✅ Updated route handlers to support Harbor API with feature flag toggle
- ✅ Comprehensive API documentation with examples
- ✅ Synced client-side and server-side types

**Client Application** (`client/`)
- ✅ React app with TypeScript
- ✅ React Router setup
- ✅ Sidebar navigation component
- ✅ Dashboard page (placeholder)
- ✅ Withdrawals list page (UI structure)
- ✅ Withdrawal detail page (placeholder)
- ✅ Documents page (placeholder)
- ✅ User search page (placeholder)
- ✅ User detail page (placeholder)

**Server Application** (`server/`)
- ✅ Express server with TypeScript
- ✅ API route structure:
  - `/api/withdrawals` - Withdrawal management endpoints
  - `/api/documents` - Document warehouse endpoints
  - `/api/users` - User search endpoints
  - `/api/dashboard` - Dashboard metrics endpoint
- ✅ Harbor API client class with method stubs
- ✅ Type definitions for Harbor API responses
- ✅ Seasoned cash calculation logic (5-business-day rule)
- ✅ Data conversion utilities
- ✅ Authentication middleware (Stytch integration ready)
- ✅ RBAC middleware (admin-only routes ready)

### Next Phases (Pending)

**Phase 2: Invest Withdrawal Management Module**
- Withdrawal status dashboard with real data
- Withdrawal detail view with all features
- Account activity view with transaction codes
- Remediation actions (cancel/reprocess)

**Phase 3: Enhanced Document & Statement Warehouse**
- Document retrieval enhancements
- Bulk download engine
- S3 archive integration

**Phase 4: Dashboard & Navigation Updates**
- Dashboard KPIs with real metrics
- User detail enhancements

**Phase 5-8: API Integration, UI Components, RBAC, Testing**

## Project Structure

```
wts-admin-portal/
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   └── AppSidebar.tsx
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Withdrawals.tsx
│   │   │   ├── WithdrawalDetail.tsx
│   │   │   ├── Documents.tsx
│   │   │   ├── UserSearch.tsx
│   │   │   └── UserDetail.tsx
│   │   ├── App.tsx           # Main app with routing
│   │   └── main.tsx          # Entry point
│   ├── package.json
│   └── vite.config.ts
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   │   ├── withdrawals.ts
│   │   │   ├── documents.ts
│   │   │   ├── users.ts
│   │   │   └── dashboard.ts
│   │   ├── types/            # TypeScript type definitions
│   │   │   └── harbor.ts
│   │   ├── utils/            # Utility functions
│   │   │   ├── seasonedCash.ts
│   │   │   └── harborConverters.ts
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.ts
│   │   │   └── rbac.ts
│   │   ├── harbor.ts         # Harbor API client
│   │   ├── routes.ts         # Main router
│   │   └── index.ts          # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── package.json              # Root package
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

### Development

From the root directory:

```bash
# Start both client and server in development mode
npm run dev

# Or start them separately:
npm run dev:client  # Starts Vite dev server on port 3000
npm run dev:server  # Starts Express server on port 3001
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Harbor API Configuration
HARBOR_API_BASE_URL=https://api.harbor.example.com
HARBOR_ORG_UNIT_ID=your-org-unit-id

# Stytch Authentication
STYTCH_PROJECT_ID=your-stytch-project-id
STYTCH_SECRET=your-stytch-secret

# AWS S3 Configuration
AWS_S3_BUCKET=wts-documents
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Server Configuration
PORT=3001
NODE_ENV=development
```

See `server/.env.example` for reference.

## Key Features (Planned)

### Seasoned Cash Calculation

The `server/src/utils/seasonedCash.ts` utility implements the 5-business-day rule:
- Funds must be held for 5 business days (excluding weekends) before withdrawal
- Calculates available balance based on transaction dates
- Provides detailed breakdown of seasoned vs unseasoned transactions
- TODO: Add holiday calendar support

### Harbor API Integration

The `server/src/harbor.ts` client provides methods for:
- **Payment Instructions API** - Get withdrawal/payment status and history
- **Clients API** - Get client information and personal details
- **Accounts API** - Get account details and balances by client or account ID
- **Documents API** - Retrieve tax documents and statements with pre-signed S3 URLs

**Status**: ✅ Fully integrated with Harbor API schema from Swagger documentation

**Feature Flag**: Set `USE_HARBOR_API=true` in `.env` to enable Harbor API (default: mock data)

**Documentation**: See `docs/HARBOR_API_MAPPING.md` for comprehensive API guide

### Transaction Codes

Transaction codes follow Harbor API conventions:
- **CR**: Cash Received (deposits)
- **BUY**: Securities Purchased
- **SEL**: Shares Sold (liquidation)
- **DR**: DDA Disbursement (money transferred out)

## Next Steps

1. **Harbor API Discovery**: Update `server/src/harbor.ts` with actual endpoint paths and request/response formats
2. **Stytch Integration**: Complete authentication middleware in `server/src/middleware/auth.ts`
3. **S3 Integration**: Implement document storage in `server/src/routes/documents.ts`
4. **UI Components**: Build Phase 6 components (WithdrawalStatusBadge, SeasonedCashDisplay, etc.)
5. **Testing**: Add unit tests for seasoned cash calculation and API integration
6. **Deployment**: Configure deployment pipeline with Dockerfile

## Notes

- Currently uses placeholder/mock data for development
- Business day calculation excludes weekends (holiday handling can be added)
- All dates are handled in UTC/ISO format
- Authentication and RBAC are stubbed and ready for Stytch integration
