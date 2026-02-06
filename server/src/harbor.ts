import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  HarborApiResponse,
  HarborApiError,
  HarborPaymentInstruction,
  HarborClient as HarborClientType,
  HarborAccount,
  HarborDocument,
  HarborDocumentDetail,
  HarborDocumentType,
  HarborAccountBalance,
  HarborTransaction,
  HarborWithdrawal,
} from './types/harbor';

/**
 * Harbor API Client Configuration
 */
interface HarborClientConfig {
  clientAccountBaseURL: string; // For clients, accounts, documents
  paymentsBaseURL: string; // For payment instructions
  apiKey?: string;
  bearerToken?: string;
  timeout?: number;
}

/**
 * Harbor API Client
 * Handles all interactions with the Harbor API
 */
export class HarborClient {
  private clientAccountClient: AxiosInstance;
  private paymentsClient: AxiosInstance;

  constructor(config: HarborClientConfig) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Support flexible authentication
    if (config.apiKey) {
      headers['X-API-Key'] = config.apiKey;
    }
    if (config.bearerToken) {
      headers['Authorization'] = `Bearer ${config.bearerToken}`;
    }

    // Client for accounts, clients, and documents
    this.clientAccountClient = axios.create({
      baseURL: config.clientAccountBaseURL,
      headers,
      timeout: config.timeout || 30000,
    });

    // Client for payment instructions
    this.paymentsClient = axios.create({
      baseURL: config.paymentsBaseURL,
      headers,
      timeout: config.timeout || 30000,
    });

    // Add response interceptors for error handling
    this.setupInterceptors(this.clientAccountClient);
    this.setupInterceptors(this.paymentsClient);
  }

  /**
   * Setup axios interceptors for consistent error handling
   */
  private setupInterceptors(client: AxiosInstance): void {
    client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<HarborApiError>) => {
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          const errorMessages = errors.map((e) => `${e.title}: ${e.detail || ''}`).join('; ');
          throw new Error(errorMessages);
        }
        throw error;
      }
    );
  }

  /**
   * Unwrap Harbor API response from { data, meta } structure
   */
  private unwrap<T>(response: HarborApiResponse<T>): T {
    return response.data;
  }

  // ============================================================================
  // Payment Instructions (Withdrawals) API
  // ============================================================================

  /**
   * Get payment instructions for an account within a date range
   * GET /v1/payments/payment-instructions?accountId={id}&startDate={date}&endDate={date}
   */
  async getPaymentInstructions(
    accountId: string,
    startDate: string, // YYYY-MM-DD
    endDate: string // YYYY-MM-DD
  ): Promise<HarborPaymentInstruction[]> {
    try {
      const response = await this.paymentsClient.get<
        HarborApiResponse<HarborPaymentInstruction[]>
      >('/payments/payment-instructions', {
        params: { accountId, startDate, endDate },
      });
      return this.unwrap(response.data);
    } catch (error) {
      console.error('Error fetching payment instructions:', error);
      throw new Error('Failed to fetch payment instructions');
    }
  }

  /**
   * Get a single payment instruction by ID
   * GET /v1/payments/payment-instructions/{paymentInstructionId}
   */
  async getPaymentInstruction(
    paymentInstructionId: string
  ): Promise<HarborPaymentInstruction> {
    try {
      const response = await this.paymentsClient.get<
        HarborApiResponse<HarborPaymentInstruction>
      >(`/payments/payment-instructions/${paymentInstructionId}`);
      return this.unwrap(response.data);
    } catch (error) {
      console.error('Error fetching payment instruction:', error);
      throw new Error('Failed to fetch payment instruction');
    }
  }

  // ============================================================================
  // Clients API
  // ============================================================================

  /**
   * Get client by ID
   * GET /v1/clients/{clientId}
   */
  async getClient(clientId: string): Promise<HarborClientType> {
    try {
      const response = await this.clientAccountClient.get<
        HarborApiResponse<HarborClientType>
      >(`/clients/${clientId}`);
      return this.unwrap(response.data);
    } catch (error) {
      console.error('Error fetching client:', error);
      throw new Error('Failed to fetch client');
    }
  }

  // ============================================================================
  // Accounts API
  // ============================================================================

  /**
   * Get account by ID
   * GET /v1/accounts/{accountId}
   */
  async getAccount(accountId: string): Promise<HarborAccount> {
    try {
      const response = await this.clientAccountClient.get<HarborApiResponse<HarborAccount>>(
        `/accounts/${accountId}`
      );
      return this.unwrap(response.data);
    } catch (error) {
      console.error('Error fetching account:', error);
      throw new Error('Failed to fetch account');
    }
  }

  /**
   * Get all accounts for a client
   * GET /v1/accounts?clientId={clientId}
   */
  async getAccountsByClient(clientId: string): Promise<HarborAccount[]> {
    try {
      const response = await this.clientAccountClient.get<
        HarborApiResponse<HarborAccount[]>
      >('/accounts', {
        params: { clientId },
      });
      return this.unwrap(response.data);
    } catch (error) {
      console.error('Error fetching accounts by client:', error);
      throw new Error('Failed to fetch accounts by client');
    }
  }

  /**
   * Create a new account
   * POST /v1/accounts
   */
  async createAccount(accountData: {
    data: {
      clientId: string;
      name: string;
      accountType: 'INDIV' | 'NON_INDIV';
      entitlements: string[];
    };
  }): Promise<HarborAccount> {
    try {
      const response = await this.clientAccountClient.post<HarborApiResponse<HarborAccount>>(
        '/accounts',
        accountData
      );
      return this.unwrap(response.data);
    } catch (error) {
      console.error('Error creating account:', error);
      throw new Error('Failed to create account');
    }
  }

  // ============================================================================
  // Documents API
  // ============================================================================

  /**
   * Get list of documents for an account
   * GET /v1/documents?accountId={id}&type={type}&from={date}&to={date}
   */
  async getDocuments(params: {
    accountId: string;
    type: HarborDocumentType;
    from?: string; // YYYY-MM-DD (required for most types except W9)
    to?: string; // YYYY-MM-DD (optional, defaults to current date)
  }): Promise<HarborDocument[]> {
    try {
      const response = await this.clientAccountClient.get<
        HarborApiResponse<HarborDocument[]>
      >('/documents', {
        params,
      });
      return this.unwrap(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }
  }

  /**
   * Get document download URL
   * GET /v1/documents/{documentId}
   * Returns pre-signed S3 URL that expires after a period (typically 1 hour)
   */
  async getDocumentDownloadUrl(documentId: string): Promise<HarborDocumentDetail> {
    try {
      const response = await this.clientAccountClient.get<
        HarborApiResponse<HarborDocumentDetail>
      >(`/documents/${documentId}`);
      return this.unwrap(response.data);
    } catch (error) {
      console.error('Error fetching document download URL:', error);
      throw new Error('Failed to fetch document download URL');
    }
  }

  // ============================================================================
  // Legacy Methods (for backwards compatibility with mock data)
  // ============================================================================

  /**
   * Get account balances for seasoned cash calculation
   * NOTE: This endpoint is not yet documented in Harbor API
   */
  async getAccountBalances(accountId: string): Promise<HarborAccountBalance> {
    try {
      // TODO: Replace with actual Harbor API endpoint when available
      const response = await this.clientAccountClient.get(`/accounts/${accountId}/balances`);
      return response.data;
    } catch (error) {
      console.error('Error fetching account balances:', error);
      throw new Error('Failed to fetch account balances (endpoint not yet available)');
    }
  }

  /**
   * Get account transactions for activity view
   * NOTE: Transaction data comes from Books & Records/DTC system, not Harbor
   */
  async getAccountTransactions(
    accountId: string,
    startDate?: string,
    endDate?: string
  ): Promise<HarborTransaction[]> {
    try {
      // TODO: Integrate with Books & Records/DTC system
      const response = await this.clientAccountClient.get(`/accounts/${accountId}/transactions`, {
        params: { startDate, endDate },
      });
      return response.data.transactions || [];
    } catch (error) {
      console.error('Error fetching account transactions:', error);
      throw new Error('Failed to fetch account transactions (use Books & Records system)');
    }
  }

  /**
   * Get withdrawal status (legacy - use getPaymentInstruction instead)
   * @deprecated Use getPaymentInstruction() instead
   */
  async getWithdrawalStatus(withdrawalId: string): Promise<HarborWithdrawal> {
    console.warn('getWithdrawalStatus is deprecated. Use getPaymentInstruction instead.');
    try {
      const response = await this.paymentsClient.get(`/withdrawals/${withdrawalId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching withdrawal status:', error);
      throw new Error('Failed to fetch withdrawal status');
    }
  }

  /**
   * Get all withdrawals (legacy - use getPaymentInstructions instead)
   * @deprecated Use getPaymentInstructions() instead
   */
  async getWithdrawals(filters?: {
    status?: string;
    accountId?: string;
    clientId?: string;
  }): Promise<HarborWithdrawal[]> {
    console.warn('getWithdrawals is deprecated. Use getPaymentInstructions instead.');
    try {
      const response = await this.paymentsClient.get('/withdrawals', { params: filters });
      return response.data.withdrawals || [];
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      throw new Error('Failed to fetch withdrawals');
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let harborClientInstance: HarborClient | null = null;

/**
 * Get singleton instance of Harbor API client
 */
export function getHarborClient(): HarborClient {
  if (!harborClientInstance) {
    const config: HarborClientConfig = {
      clientAccountBaseURL:
        process.env.HARBOR_BASE_URL ||
        'https://bo-api.development.wedbush.tech/client-account/v1',
      paymentsBaseURL:
        process.env.HARBOR_PAYMENTS_BASE_URL || 'https://bo-api.production.wedbush.tech/v1',
      apiKey: process.env.HARBOR_API_KEY,
      bearerToken: process.env.HARBOR_BEARER_TOKEN,
    };

    harborClientInstance = new HarborClient(config);
  }
  return harborClientInstance;
}

/**
 * Reset singleton instance (useful for testing)
 */
export function resetHarborClient(): void {
  harborClientInstance = null;
}
