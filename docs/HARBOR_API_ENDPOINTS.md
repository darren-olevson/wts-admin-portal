# Harbor API Endpoint Documentation

This document identifies and documents the Harbor API endpoints required for the WTS Admin Portal.

## Base Configuration

- **Base URL**: `{HARBOR_API_BASE_URL}` (configured via environment variable)
- **Organization Unit ID**: `{HARBOR_ORG_UNIT_ID}` (configured via environment variable)
- **Authentication**: TBD (to be determined based on Harbor API requirements)

## Endpoints

### 1. Account Balances

**Purpose**: Retrieve account balance information for seasoned cash calculation.

**Endpoint**: `GET /accounts/{accountId}/balances`

**Path Parameters**:
- `accountId` (string, required): The account identifier

**Query Parameters**: None

**Response Format**:
```json
{
  "accountId": "string",
  "totalBalance": 0.00,
  "availableBalance": 0.00,
  "unseasonedBalance": 0.00,
  "currency": "USD",
  "lastUpdated": "2024-01-01T00:00:00Z",
  "balanceDetails": [
    {
      "date": "2024-01-01T00:00:00Z",
      "amount": 0.00,
      "isSeasoned": true
    }
  ]
}
```

**Notes**:
- `availableBalance`: Funds available to withdraw (seasoned for 5+ business days)
- `unseasonedBalance`: Funds not yet available (within 5 business days)
- Used for seasoned cash verification in withdrawal detail view

**Status Codes**:
- `200`: Success
- `404`: Account not found
- `500`: Server error

---

### 2. Account Transactions

**Purpose**: Retrieve account transaction history with transaction codes for activity view.

**Endpoint**: `GET /accounts/{accountId}/transactions`

**Path Parameters**:
- `accountId` (string, required): The account identifier

**Query Parameters**:
- `startDate` (string, optional): Start date in ISO 8601 format (YYYY-MM-DD)
- `endDate` (string, optional): End date in ISO 8601 format (YYYY-MM-DD)
- `transactionCode` (string, optional): Filter by transaction code (CR, BUY, SEL, DR)
- `limit` (number, optional): Maximum number of results (default: 100)
- `offset` (number, optional): Pagination offset (default: 0)

**Response Format**:
```json
{
  "transactions": [
    {
      "transactionId": "string",
      "accountId": "string",
      "transactionCode": "CR",
      "transactionType": "CASH_RECEIVED",
      "amount": 0.00,
      "date": "2024-01-01T00:00:00Z",
      "description": "string",
      "relatedWithdrawalId": "string (optional)"
    }
  ],
  "total": 0,
  "limit": 100,
  "offset": 0
}
```

**Transaction Codes**:
- `CR`: Cash Received (deposits)
- `BUY`: Securities purchased
- `SEL`: Shares sold (liquidation)
- `DR`: DDA Disbursement (money transferred out)

**Status Codes**:
- `200`: Success
- `400`: Invalid parameters
- `404`: Account not found
- `500`: Server error

---

### 3. Withdrawal Status

**Purpose**: Get detailed status information for a specific withdrawal request.

**Endpoint**: `GET /withdrawals/{withdrawalId}`

**Path Parameters**:
- `withdrawalId` (string, required): The withdrawal request identifier

**Query Parameters**: None

**Response Format**:
```json
{
  "withdrawalId": "string",
  "accountId": "string",
  "clientId": "string",
  "clientName": "string",
  "status": "PENDING_LIQUIDATION",
  "requestAmount": 0.00,
  "requestDate": "2024-01-01T00:00:00Z",
  "brokerageAccountNumber": "string",
  "brokerageId": "string",
  "goalId": "string",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "statusHistory": [
    {
      "status": "string",
      "timestamp": "2024-01-01T00:00:00Z",
      "notes": "string"
    }
  ]
}
```

**ACH Transfer Status Values (per EDD)**:
- `CREATED`: Initial state (no liquidation) or post-liquidation settlement
- `PENDING_LIQUIDATION`: Awaiting liquidation completion
- `PROCESSING`: ACH job picked up for processing
- `PROCESSED`: Submitted to ACH Network
- `RETRYING`: Rejected by ACH, will retry
- `RECONCILED`: Reconciled via BOD files
- `STALE`: Not reconciled after 7 days
- `COMPLETE`: Successfully completed
- `FAILED`: Terminal failure
- `CANCELLED`: Manually cancelled

**Status Codes**:
- `200`: Success
- `404`: Withdrawal not found
- `500`: Server error

---

### 4. List Withdrawals

**Purpose**: Get list of withdrawals with filtering and search capabilities.

**Endpoint**: `GET /withdrawals`

**Path Parameters**: None

**Query Parameters**:
- `status` (string[], optional): Filter by status values (comma-separated)
- `accountId` (string, optional): Filter by account ID
- `clientId` (string, optional): Filter by client ID
- `clientName` (string, optional): Search by client name (partial match)
- `minAgeDays` (number, optional): Filter withdrawals older than N days
- `limit` (number, optional): Maximum number of results (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response Format**:
```json
{
  "withdrawals": [
    {
      "withdrawalId": "string",
      "accountId": "string",
      "clientId": "string",
      "clientName": "string",
      "status": "PENDING_LIQUIDATION",
      "requestAmount": 0.00,
      "requestDate": "2024-01-01T00:00:00Z",
      "ageInDays": 0
    }
  ],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid parameters
- `500`: Server error

---

### 5. Cancel Withdrawal

**Purpose**: Cancel a withdrawal request (admin-only action).

**Endpoint**: `POST /withdrawals/{withdrawalId}/cancel`

**Path Parameters**:
- `withdrawalId` (string, required): The withdrawal request identifier

**Request Body**:
```json
{
  "notes": "string (required)",
  "cancelledBy": "string (user ID)"
}
```

**Response Format**:
```json
{
  "success": true,
  "withdrawalId": "string",
  "newStatus": "CANCELLED",
  "cancelledAt": "2024-01-01T00:00:00Z"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request (e.g., missing notes)
- `403`: Forbidden (not admin)
- `404`: Withdrawal not found
- `409`: Withdrawal cannot be cancelled (wrong status)
- `500`: Server error

---

### 6. Reprocess Withdrawal

**Purpose**: Create a new withdrawal request based on a failed one (admin-only action).

**Endpoint**: `POST /withdrawals/{withdrawalId}/reprocess`

**Path Parameters**:
- `withdrawalId` (string, required): The original withdrawal request identifier

**Request Body**:
```json
{
  "notes": "string (required)",
  "reprocessedBy": "string (user ID)",
  "amount": 0.00 (optional, defaults to original amount)
}
```

**Response Format**:
```json
{
  "success": true,
  "originalWithdrawalId": "string",
  "newWithdrawalId": "string",
  "status": "PENDING",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request (e.g., missing notes)
- `403`: Forbidden (not admin)
- `404`: Original withdrawal not found
- `500`: Server error

---

### 7. Order Validation

**Purpose**: Validate an order before processing (used for reprocess validation).

**Endpoint**: `POST /orders/validate`

**Path Parameters**: None

**Request Body**:
```json
{
  "accountId": "string",
  "orderType": "WITHDRAWAL",
  "amount": 0.00,
  "currency": "USD"
}
```

**Response Format**:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "validationDetails": {
    "accountExists": true,
    "sufficientBalance": true,
    "seasonedCashAvailable": 0.00
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid request
- `500`: Server error

---

## Error Response Format

All endpoints return errors in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

## Authentication

**TBD**: Authentication mechanism to be determined based on Harbor API requirements.

Possible options:
- API Key in headers
- OAuth 2.0 / Bearer token
- Basic authentication
- Custom authentication scheme

## Rate Limiting

**TBD**: Rate limiting information to be documented when available.

## Data Latency Considerations

- Transaction data may have latency due to SFTP to P3 and Async API to Broadridge
- Balance information should be near real-time
- Withdrawal status updates may be delayed by processing time

## Implementation Notes

1. All date/time fields use ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
2. All monetary amounts are in decimal format (e.g., 1234.56)
3. Pagination uses limit/offset pattern
4. Transaction codes are standardized: CR, BUY, SEL, DR
5. Withdrawal status values are case-sensitive and must match exactly

## Next Steps

1. **Verify Endpoint Paths**: Confirm actual endpoint paths with Harbor API documentation
2. **Authentication Setup**: Implement authentication mechanism
3. **Response Schema Validation**: Validate actual response formats match documented schemas
4. **Error Handling**: Document all possible error codes and messages
5. **Testing**: Create integration tests for each endpoint
