# Harbor API Integration Guide

This document provides comprehensive documentation for integrating the WTS Admin Portal with Harbor APIs.

## Table of Contents

- [Overview](#overview)
- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [API Response Structure](#api-response-structure)
- [Endpoint Mappings](#endpoint-mappings)
- [Data Type Mappings](#data-type-mappings)
- [Feature Flag Configuration](#feature-flag-configuration)
- [Known Limitations](#known-limitations)
- [Examples](#examples)

## Overview

The WTS Admin Portal integrates with Harbor APIs to manage:
- **Payment Instructions** (Withdrawals)
- **Client Information** (User details)
- **Account Management** (Account details and balances)
- **Document Management** (Tax documents and statements)

## Base URLs

### Development Environment

```
Client/Account API:  https://bo-api.development.wedbush.tech/client-account/v1
Payments API:        https://bo-api.production.wedbush.tech/v1
```

### Production Environment

```
Client/Account API:  https://bo-api.production.wedbush.tech/client-account/v1
Payments API:        https://bo-api.production.wedbush.tech/v1
```

## Authentication

Harbor APIs support flexible authentication:

### API Key Authentication
```bash
X-API-Key: your-api-key-here
```

### Bearer Token Authentication
```bash
Authorization: Bearer your-bearer-token-here
```

### Environment Configuration

Add to `.env` file:

```env
# Harbor API Base URLs
HARBOR_BASE_URL=https://bo-api.development.wedbush.tech/client-account/v1
HARBOR_PAYMENTS_BASE_URL=https://bo-api.production.wedbush.tech/v1

# Authentication (supports one or both)
HARBOR_API_KEY=your-api-key
HARBOR_BEARER_TOKEN=your-bearer-token

# Feature flags
USE_HARBOR_API=false  # Set to 'true' to enable Harbor API integration
```

## API Response Structure

All Harbor API responses follow this standard structure:

### Success Response

```json
{
  "data": {
    // Response data (object or array)
  },
  "meta": {
    // Optional metadata
  }
}
```

### Error Response

```json
{
  "errors": [
    {
      "code": "BAD_REQUEST",
      "title": "Invalid Query Parameters",
      "detail": "Additional error details (optional)"
    }
  ],
  "meta": {}
}
```

## Endpoint Mappings

### Portal Feature → Harbor API Mapping

| Portal Feature | Harbor API Endpoint | Method | Description |
|---------------|---------------------|--------|-------------|
| Withdrawals List | `/v1/payments/payment-instructions` | GET | Get payment instructions for an account |
| Withdrawal Detail | `/v1/payments/payment-instructions/{id}` | GET | Get specific payment instruction |
| User Search | `/v1/clients/{clientId}` | GET | Get client by ID |
| User Details | `/v1/clients/{clientId}` + `/v1/accounts?clientId={id}` | GET | Get client info and accounts |
| Account Details | `/v1/accounts/{accountId}` | GET | Get account by ID |
| Accounts by Client | `/v1/accounts?clientId={id}` | GET | Get all accounts for a client |
| Documents List | `/v1/documents?accountId={id}&type={type}&from={date}` | GET | Get documents for an account |
| Document Download | `/v1/documents/{documentId}` | GET | Get pre-signed S3 URL |

## Data Type Mappings

### Payment Status Mapping (Harbor Payment API to EDD ACH Transfer Status)

| Harbor Payment Status | EDD ACH Transfer Status |
|----------------------|--------------------------|
| `PENDING` | `CREATED` |
| `PROCESSING` | `PROCESSING` |
| `COMPLETED` | `COMPLETE` |
| `FAILED` | `FAILED` |
| `CANCELLED` | `CANCELLED` |

### ACH Transfer Status (per EDD Combination Endpoint)

| Status | Description |
|--------|-------------|
| `CREATED` | Initial state (no liquidation) or post-liquidation settlement |
| `PENDING_LIQUIDATION` | Awaiting liquidation completion |
| `PROCESSING` | ACH job picked up for processing |
| `PROCESSED` | Submitted to ACH Network |
| `RETRYING` | Rejected by ACH Network, will retry |
| `RECONCILED` | Reconciled via BOD files |
| `STALE` | Not reconciled after 7 days |
| `COMPLETE` | Successfully completed |
| `FAILED` | Terminal failure |
| `CANCELLED` | Manually cancelled |

### Liquidation Status (Cash Movement, per EDD)

| Status | Description |
|--------|-------------|
| `CREATED` | Initial state, request sent to Pillar |
| `PENDING` | Awaiting execution |
| `FAILED` | Liquidation process failed |
| `COMPLETE` | Successfully completed, cash available |
| `CANCELLED` | Manually cancelled |
| `PROCESSED_SUCCESSFULLY` | CASH Record processed and sent to WSI |

### Document Type Mapping

| Portal Document Type | Harbor Document Type |
|---------------------|---------------------|
| Monthly Statement | `STATEMENTS_MONTHLY` |
| Daily Statement | `STATEMENTS_DAILY` |
| Trade Confirmation | `TRADE_CONFIRMATIONS` |
| Tax Form (1099) | `TAX_FORMS` |
| W9 Form | `W9` |
| Form 407 | `407` |

### Account Type Mapping

| Harbor Account Type | Description |
|--------------------|-------------|
| `INDIV` | Individual Account |
| `NON_INDIV` | Joint or Entity Account |

### Account Status Mapping

| Harbor Status | Description |
|--------------|-------------|
| `OPEN` | Fully operational account |
| `RESTRICTED` | Has regulatory restrictions (e.g., FINRA association) |
| `null` | Status unknown or not applicable |

## Feature Flag Configuration

The portal uses feature flags to toggle between mock data and Harbor API:

### Enable Harbor API

```bash
# In .env file
USE_HARBOR_API=true
```

### Disable Harbor API (use mock data)

```bash
# In .env file
USE_HARBOR_API=false
```

When `USE_HARBOR_API=false`, all routes use mock data for development and testing.

## Known Limitations

### 1. Payment Cancellation/Reprocessing
- **Status**: Not supported by Harbor API
- **Current Behavior**: Routes return mock responses with warning message
- **Impact**: Cancel and reprocess buttons in UI work but don't actually modify Harbor data

### 2. Transaction History
- **Status**: Not available from Harbor API
- **Data Source**: Should come from Books & Records/DTC system
- **Current Behavior**: Uses mock data

### 3. Seasoned Cash Calculations
- **Status**: Not available from Harbor API
- **Current Behavior**: Uses local calculation logic with mock transaction data
- **Future**: May integrate with Harbor balances endpoint when available

### 4. Client Search
- **Status**: Limited functionality
- **Current Behavior**: Requires exact client ID (no fuzzy search)
- **Future**: May need additional search endpoint or integration

### 5. Dashboard Metrics
- **Status**: Uses mock data
- **Current Behavior**: Aggregated KPIs calculated from mock withdrawals
- **Future**: Will need aggregation endpoint or client-side calculation

## Examples

### 1. Get Payment Instructions (Withdrawals)

**Request:**
```bash
GET /v1/payments/payment-instructions?accountId=123e4567-e89b-12d3-a456-426614174000&startDate=2026-01-01&endDate=2026-01-31
X-API-Key: your-api-key
```

**Response:**
```json
{
  "data": [
    {
      "id": "pi_abc123",
      "transferType": "WIRE",
      "orchestrationMode": "PARTNER_PROCESSOR",
      "status": "PROCESSING",
      "sourceAccount": {
        "accountId": "123e4567-e89b-12d3-a456-426614174000",
        "accountNumber": "AB00001337"
      },
      "destinationAccount": {
        "accountNumber": "9876543210",
        "routingNumber": "123456789",
        "institutionName": "Chase Bank"
      },
      "sourceAmount": 5000.00,
      "sourceCurrency": "USD",
      "destinationAmount": 5000.00,
      "destinationCurrency": "USD",
      "createdAt": "2026-01-15T10:30:00Z",
      "updatedAt": "2026-01-15T14:20:00Z",
      "metadata": {
        "clientId": "client-789",
        "clientName": "John Doe"
      }
    }
  ],
  "meta": {}
}
```

### 2. Get Client Details

**Request:**
```bash
GET /v1/clients/987e4567-e89b-12d3-a456-426614174999
X-API-Key: your-api-key
```

**Response:**
```json
{
  "data": {
    "clientId": "987e4567-e89b-12d3-a456-426614174999",
    "emailAddress": "john.doe@example.com",
    "contactInformation": {
      "phoneNumber": "+1-555-123-4567",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "country": "USA"
      }
    },
    "personalInformation": {
      "firstName": "John",
      "lastName": "Doe",
      "dateOfBirth": "1985-06-15",
      "citizenship": "USA",
      "countryOfResidence": "USA",
      "taxResidency": "USA"
    }
  },
  "meta": {}
}
```

### 3. Get Accounts by Client

**Request:**
```bash
GET /v1/accounts?clientId=987e4567-e89b-12d3-a456-426614174999
X-API-Key: your-api-key
```

**Response:**
```json
{
  "data": [
    {
      "accountId": "123e4567-e89b-12d3-a456-426614174000",
      "accountNumber": "AB00001337",
      "clientId": "987e4567-e89b-12d3-a456-426614174999",
      "name": "My Trading Account",
      "accountType": "INDIV",
      "accountStatus": "OPEN",
      "entitlements": [
        "EVENT_CONTRACTS",
        "STOCKS",
        "OPTIONS"
      ]
    }
  ],
  "meta": {}
}
```

### 4. Get Documents

**Request:**
```bash
GET /v1/documents?accountId=123e4567-e89b-12d3-a456-426614174000&type=TAX_FORMS&from=2025-01-01&to=2025-12-31
X-API-Key: your-api-key
```

**Response:**
```json
{
  "data": [
    {
      "documentId": "76f71b9c-32c0-4cde-b900-b9effa7d3ec3",
      "documentName": "1099-B Tax Form - 2025",
      "documentType": "TAX_FORMS"
    }
  ],
  "meta": {}
}
```

### 5. Get Document Download URL

**Request:**
```bash
GET /v1/documents/76f71b9c-32c0-4cde-b900-b9effa7d3ec3
X-API-Key: your-api-key
```

**Response:**
```json
{
  "data": {
    "accountId": "123e4567-e89b-12d3-a456-426614174000",
    "documentId": "76f71b9c-32c0-4cde-b900-b9effa7d3ec3",
    "documentName": "1099-B Tax Form - 2025",
    "documentType": "TAX_FORMS",
    "documentUrl": "https://wts-harbor-documents-development-us-east-1.s3.us-east-1.amazonaws.com/account-documents/1099-B-2025.pdf?X-Amz-Expires=3600&..."
  },
  "meta": {}
}
```

**Note:** The `documentUrl` is a pre-signed S3 URL that typically expires after 1 hour.

## Error Handling

### Common Error Codes

| HTTP Status | Error Code | Description | Action |
|------------|------------|-------------|--------|
| 400 | `BAD_REQUEST` | Invalid request parameters | Validate input parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid credentials | Check API key/token |
| 403 | `FORBIDDEN` | Insufficient permissions | Verify access rights |
| 404 | `NOT_FOUND` | Resource not found | Verify IDs are correct |
| 500 | `INTERNAL_SERVER_ERROR` | Server error | Retry or contact support |

### Error Handling Example

```typescript
try {
  const client = await harborClient.getClient(clientId);
  // Process client data
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Client not found');
  } else if (error.response?.status === 401) {
    console.error('Authentication failed');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Testing

### Using Mock Data

For development and testing without Harbor API access:

1. Set `USE_HARBOR_API=false` in `.env`
2. All routes will use mock data defined in `server/src/utils/mockData.ts`
3. Mock data includes realistic sample data for all features

### Using Harbor API

For testing with actual Harbor API:

1. Set `USE_HARBOR_API=true` in `.env`
2. Configure authentication credentials
3. Ensure network access to Harbor API endpoints
4. Use valid UUIDs for client/account IDs

## Migration Checklist

When switching from mock data to Harbor API:

- [ ] Configure Harbor API credentials in `.env`
- [ ] Verify network connectivity to Harbor endpoints
- [ ] Test authentication (API key or Bearer token)
- [ ] Test each feature with real data:
  - [ ] Withdrawal list and details
  - [ ] User search and details
  - [ ] Document retrieval
  - [ ] Account information
- [ ] Set `USE_HARBOR_API=true`
- [ ] Monitor error logs for API issues
- [ ] Verify data conversions are working correctly
- [ ] Test error scenarios (404s, 400s, etc.)

## Support

For issues with Harbor API integration:

1. Check error logs in server console
2. Verify credentials and permissions
3. Review this documentation
4. Contact Harbor API support team

For issues with the portal integration:

1. Check feature flag settings
2. Verify data converters are working
3. Review route handler implementations
4. Check type definitions match API responses
