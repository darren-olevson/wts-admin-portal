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

### EDD Liquidation & Withdrawal Status Refactor ✅ COMPLETED

Full codebase refactoring to align with the **Liquidation and Withdrawals (Combination Endpoint) EDD**. This was a comprehensive update across 24 files to ensure the admin portal correctly maps to the documented ACH Transfer and Liquidation status lifecycles.

**What Changed:**

1. **Type Definitions** — All three type definition files (`server/src/types/harbor.ts`, `client/src/types/harbor.ts`, `server/types/harbor.ts`) updated with EDD-aligned status types.

2. **Status Derivation Logic** — `deriveLiquidationStatus()` and `deriveTransferStatus()` in `harborConverters.ts` rewritten to use the nested `liquidation` object when available and map statuses per the EDD state diagrams.

3. **UI Components** — All status badges, the status funnel, dashboard summary cards, filter dropdowns, withdrawal detail pages, and remediation dialogs updated to reflect EDD statuses.

4. **Server Routes** — Withdrawal create/reprocess/skip-liquidation endpoints and dashboard metrics updated to use EDD statuses exclusively.

5. **Mock Data** — Both server and client mock data updated with EDD statuses, nested `liquidation` objects, and new entries for PROCESSING, RETRYING, RECONCILED, and STALE statuses.

6. **Documentation** — `HARBOR_API_MAPPING.md` and `HARBOR_API_ENDPOINTS.md` updated with EDD status tables.

**Legacy Statuses Removed:**
| Legacy Status | Disposition |
|---|---|
| `Liquidation_pending` | Removed. Replaced by `PENDING_LIQUIDATION` (ACH Transfer) |
| `Transfer_pending` | Removed. Not in EDD |
| `Withdrawal_approval_failed` | Removed. Mapped to `FAILED` |
| `TRANSFER_CREATED` | Removed. Mapped to `CREATED` |
| `COMPLETED` | Renamed to `COMPLETE` (per EDD) |

**New Statuses Added:**
| Status | Domain |
|---|---|
| `PROCESSING` | ACH Transfer |
| `PROCESSED` | ACH Transfer |
| `RETRYING` | ACH Transfer |
| `RECONCILED` | ACH Transfer |
| `STALE` | ACH Transfer |
| `PROCESSED_SUCCESSFULLY` | Liquidation |

See [Withdrawal & Liquidation Status Reference](#withdrawal--liquidation-status-reference) below for full details.

**Client Application** (`client/`)
- ✅ React app with TypeScript
- ✅ React Router setup
- ✅ Sidebar navigation component
- ✅ Dashboard page with EDD-aligned status summary
- ✅ Withdrawals list page with EDD status filter dropdown
- ✅ Withdrawal detail page with EDD status derivation
- ✅ Documents page
- ✅ User search page
- ✅ User detail page

**Server Application** (`server/`)
- ✅ Express server with TypeScript
- ✅ API route structure:
  - `/api/withdrawals` - Withdrawal management endpoints
  - `/api/documents` - Document warehouse endpoints
  - `/api/users` - User search endpoints
  - `/api/dashboard` - Dashboard metrics endpoint
- ✅ Harbor API client class with method stubs
- ✅ Type definitions for Harbor API responses (EDD-aligned)
- ✅ Seasoned cash calculation logic (5-business-day rule)
- ✅ Data conversion utilities with EDD status derivation
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

## Withdrawal & Liquidation Status Reference

This section documents the canonical status definitions as defined by the **Liquidation and Withdrawals (Combination Endpoint) EDD**. All status values in this codebase align with these definitions.

### ACH Transfer Status (Withdrawal Status)

These statuses represent the lifecycle of an ACH transfer (withdrawal). The combination endpoint returns this as the top-level `status` field.

```
[*] --> PENDING_LIQUIDATION (with liquidation)
[*] --> CREATED (without liquidation)
PENDING_LIQUIDATION --> CREATED (liquidation settled)
PENDING_LIQUIDATION --> CANCELLED (user cancels)
CREATED --> PROCESSING (ACH job picks up)
CREATED --> CANCELLED (user cancels)
PROCESSING --> COMPLETE (submitted to WSI)
PROCESSING --> RETRYING (WSI failed)
PROCESSING --> CANCELLED (not yet submitted)
RETRYING --> PROCESSING (next job run)
RETRYING --> FAILED (max retries)
RETRYING --> CANCELLED (user cancels)
COMPLETE --> RECONCILED (BOD confirms)
COMPLETE --> STALE (no BOD match 7d)
STALE --> RECONCILED (BOD eventually confirms)
STALE --> CANCELLED (manual intervention)
```

| Status | Description |
|--------|-------------|
| `CREATED` | Initial state (no liquidation) or post-liquidation settlement. Ready for ACH processing. |
| `PENDING_LIQUIDATION` | Awaiting liquidation completion before ACH transfer can begin. |
| `PROCESSING` | ACH job has picked up the transfer for processing. |
| `PROCESSED` | Transfer has been submitted to the ACH Network. |
| `RETRYING` | Rejected by ACH Network; will be retried on next job run. |
| `RECONCILED` | Reconciled via BOD (Beginning of Day) files from the bank. |
| `STALE` | Not reconciled after 7 days. May require manual intervention. |
| `COMPLETE` | Successfully submitted to WSI. |
| `FAILED` | Terminal failure after max retries. |
| `CANCELLED` | Manually cancelled by admin. |

> **Note:** The `PENDING` status is **deprecated** per the EDD. Use `CREATED` for initial states.

### Liquidation Status (Cash Movement Status)

These statuses represent the lifecycle of a securities liquidation. The combination endpoint returns this as a nested `liquidation.status` field within the ACH transfer response.

| Status | Description |
|--------|-------------|
| `CREATED` | Initial state. Liquidation request sent to Pillar. |
| `PENDING` | Awaiting execution of the sell order. |
| `FAILED` | Liquidation process failed. |
| `COMPLETE` | Liquidation completed. Cash is available for transfer. |
| `CANCELLED` | Liquidation cancelled by admin. |
| `PROCESSED_SUCCESSFULLY` | CASH record processed and sent to WSI. |

### Data Model

The combination endpoint returns a nested structure:

```json
{
  "id": "ach-transfer-id",
  "status": "PENDING_LIQUIDATION",
  "amount": 5000,
  "liquidation": {
    "id": "liquidation-id",
    "status": "CREATED",
    "amount": 4800,
    "isFullLiquidation": true,
    "direction": "SELL"
  }
}
```

The admin portal derives two display statuses from this:
- **Liquidation Status**: Uses `liquidation.status` when available, otherwise derived from ACH Transfer status
- **Transfer Status**: Derived from the ACH Transfer status (e.g., `PENDING_LIQUIDATION` = N/A, `CREATED`/`PROCESSING`/`PROCESSED` = PENDING, `COMPLETE`/`RECONCILED` = COMPLETE)

### Files Involved in Status Logic

| File | Purpose |
|------|---------|
| `server/src/types/harbor.ts` | Canonical type definitions (`HarborWithdrawalStatus`, `LiquidationStatus`, `LiquidationDetail`) |
| `server/src/utils/harborConverters.ts` | Server-side status derivation (`deriveLiquidationStatus`, `deriveTransferStatus`) |
| `client/src/types/harbor.ts` | Client-side type mirrors |
| `client/src/lib/api.ts` | `Withdrawal` interface consumed by all UI components |
| `client/src/components/WithdrawalStatusBadge.tsx` | Visual badge rendering for ACH Transfer statuses |
| `client/src/components/StatusBadge.tsx` | Generic status badge with auto-variant detection |
| `client/src/components/StatusFunnel.tsx` | Bottleneck visualization (Liquidation, Transfer, Retrying, Stale, Reconciliation) |
| `docs/HARBOR_API_MAPPING.md` | Full API mapping documentation |

## Next Steps

1. **Harbor API Discovery**: Update `server/src/harbor.ts` with actual endpoint paths and request/response formats
2. **Stytch Integration**: Complete authentication middleware in `server/src/middleware/auth.ts`
3. **S3 Integration**: Implement document storage in `server/src/routes/documents.ts`
4. **UI Components**: Build Phase 6 components (SeasonedCashDisplay, etc.)
5. **Testing**: Add unit tests for seasoned cash calculation and API integration
6. **Deployment**: Configure deployment pipeline with Dockerfile

## Notes

- Currently uses placeholder/mock data for development
- Business day calculation excludes weekends (holiday handling can be added)
- All dates are handled in UTC/ISO format
- Authentication and RBAC are stubbed and ready for Stytch integration
- All withdrawal/liquidation statuses are aligned with the EDD (Combination Endpoint) specification
- The `PENDING` ACH Transfer status is deprecated per EDD; `CREATED` is used instead
