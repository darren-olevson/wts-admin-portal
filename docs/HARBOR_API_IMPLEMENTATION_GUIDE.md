# Harbor API Implementation Guide

This guide provides step-by-step instructions for implementing Harbor API integration in the WTS Admin Portal.

## Overview

The Harbor API integration is documented in `HARBOR_API_ENDPOINTS.md`. This guide focuses on the implementation steps.

## Prerequisites

1. Harbor API credentials and base URL
2. Harbor organization unit ID for WTS
3. Authentication mechanism details (API key, OAuth, etc.)
4. Access to Harbor API documentation/spreadsheet

## Implementation Steps

### Step 1: Configure Environment Variables

Add to `server/.env`:

```env
HARBOR_API_BASE_URL=https://api.harbor.example.com/v1
HARBOR_ORG_UNIT_ID=wts-org-unit-id
HARBOR_API_KEY=your-api-key-here
# Or other authentication credentials as required
```

### Step 2: Update Harbor Client Authentication

Update `server/src/harbor.ts` to implement the authentication mechanism:

```typescript
constructor() {
  const baseURL = process.env.HARBOR_API_BASE_URL || '';
  this.orgUnitId = process.env.HARBOR_ORG_UNIT_ID || '';

  this.client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.HARBOR_API_KEY}`, // Or appropriate auth header
      'X-Org-Unit-Id': this.orgUnitId,
    },
    timeout: 30000,
  });
}
```

### Step 3: Implement Endpoint Methods

For each endpoint in `HARBOR_API_ENDPOINTS.md`:

1. **Verify the actual endpoint path** with Harbor API documentation
2. **Update the method implementation** in `server/src/harbor.ts`
3. **Handle response mapping** using types from `server/src/types/harbor.ts`
4. **Add error handling** for all documented status codes
5. **Add request/response logging** for debugging

### Step 4: Update Type Definitions

As you implement each endpoint:

1. Compare actual API responses with types in `server/src/types/harbor.ts`
2. Update types to match actual Harbor API response formats
3. Add any missing fields or adjust field names/types

### Step 5: Implement Data Converters

Update `server/src/utils/harborConverters.ts`:

1. Ensure transaction code mapping matches actual Harbor transaction types
2. Test conversion functions with sample Harbor API responses
3. Add any additional transformation logic needed

### Step 6: Integration Testing

Create integration tests for each endpoint:

1. Test successful responses
2. Test error cases (404, 400, 500, etc.)
3. Test pagination
4. Test filtering
5. Test authentication failures

## Endpoint Implementation Checklist

- [ ] **Account Balances** (`GET /accounts/{accountId}/balances`)
  - [ ] Implement method
  - [ ] Handle response mapping
  - [ ] Add error handling
  - [ ] Test with real API

- [ ] **Account Transactions** (`GET /accounts/{accountId}/transactions`)
  - [ ] Implement method with date range filtering
  - [ ] Implement transaction code filtering
  - [ ] Handle pagination
  - [ ] Map transaction codes correctly
  - [ ] Test with real API

- [ ] **Withdrawal Status** (`GET /withdrawals/{withdrawalId}`)
  - [ ] Implement method
  - [ ] Parse status history
  - [ ] Calculate age in days
  - [ ] Test with real API

- [ ] **List Withdrawals** (`GET /withdrawals`)
  - [ ] Implement filtering (status, accountId, clientId, clientName)
  - [ ] Implement age-based filtering (minAgeDays)
  - [ ] Implement pagination
  - [ ] Calculate age in days for each withdrawal
  - [ ] Test with real API

- [ ] **Cancel Withdrawal** (`POST /withdrawals/{withdrawalId}/cancel`)
  - [ ] Implement method with notes validation
  - [ ] Add admin-only check
  - [ ] Handle status conflicts (409)
  - [ ] Test with real API

- [ ] **Reprocess Withdrawal** (`POST /withdrawals/{withdrawalId}/reprocess`)
  - [ ] Implement method with notes validation
  - [ ] Add admin-only check
  - [ ] Handle optional amount parameter
  - [ ] Test with real API

- [ ] **Order Validation** (`POST /orders/validate`)
  - [ ] Implement method
  - [ ] Parse validation errors and warnings
  - [ ] Test with real API

## Common Implementation Patterns

### Error Handling

```typescript
try {
  const response = await this.client.get(`/accounts/${accountId}/balances`);
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      throw new Error(`Account ${accountId} not found`);
    }
    if (error.response?.status === 400) {
      throw new Error(`Invalid request: ${error.response.data.message}`);
    }
  }
  throw new Error(`Failed to fetch account balances: ${error.message}`);
}
```

### Pagination

```typescript
async getWithdrawals(filters: HarborWithdrawalFilters = {}) {
  const params = new URLSearchParams();
  
  if (filters.status) {
    filters.status.forEach(s => params.append('status', s));
  }
  if (filters.accountId) params.append('accountId', filters.accountId);
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());
  
  const response = await this.client.get(`/withdrawals?${params.toString()}`);
  return response.data;
}
```

### Date Range Filtering

```typescript
async getAccountTransactions(
  accountId: string,
  dateRange?: { start: Date; end: Date }
) {
  const params = new URLSearchParams();
  
  if (dateRange) {
    params.append('startDate', dateRange.start.toISOString().split('T')[0]);
    params.append('endDate', dateRange.end.toISOString().split('T')[0]);
  }
  
  const response = await this.client.get(
    `/accounts/${accountId}/transactions?${params.toString()}`
  );
  return response.data;
}
```

## Testing Strategy

1. **Unit Tests**: Test converter functions and utility methods
2. **Integration Tests**: Test actual Harbor API calls (use test environment)
3. **Mock Tests**: Use mocks for development when Harbor API is unavailable
4. **E2E Tests**: Test full withdrawal workflow through the UI

## Next Steps After Implementation

1. Update route handlers in `server/src/routes.ts` to use Harbor client methods
2. Implement seasoned cash calculation in `server/src/utils/seasonedCash.ts`
3. Add request/response logging for audit purposes
4. Set up monitoring and alerting for API failures
5. Document any deviations from the documented API behavior

## Troubleshooting

### Common Issues

1. **Authentication Failures**: Verify API key and authentication mechanism
2. **404 Errors**: Verify endpoint paths match Harbor API documentation
3. **Response Format Mismatches**: Update types in `server/src/types/harbor.ts`
4. **Transaction Code Mapping**: Verify actual transaction type values from Harbor
5. **Date Format Issues**: Ensure ISO 8601 format matches Harbor expectations

### Debugging Tips

1. Enable request/response logging in Harbor client
2. Use Postman/Insomnia to test endpoints directly
3. Compare actual responses with documented schemas
4. Check Harbor API documentation for any updates
