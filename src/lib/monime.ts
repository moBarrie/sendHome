import { env } from '@/env.mjs';

// Supported currencies by Monime
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'SLE'] as const; // Updated to use SLE instead of NGN
export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

// Minimum amounts per currency
export const MIN_AMOUNTS: Record<SupportedCurrency, number> = {
  USD: 1,
  EUR: 1,
  GBP: 1,
  SLE: 1000, // Sierra Leone Leone (new currency)
};

// Maximum amounts per currency
export const MAX_AMOUNTS: Record<SupportedCurrency, number> = {
  USD: 10000,
  EUR: 8500,
  GBP: 7500,
  SLE: 50000000, // Sierra Leone Leone (new currency)
};

export class MonimeError extends Error {
  constructor(
    public code: number,
    message: string,
    public reason: string | null = null,
    public details: any[] = []
  ) {
    super(message);
    this.name = 'MonimeError';
  }
}

interface MonimePayoutRequest {
  amount: number;
  currency: SupportedCurrency;
  recipient: {
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
  };
  metadata?: Record<string, any>;
  description?: string;
}

interface MonimePayoutResponse {
  success: boolean;
  data?: {
    id: string;
    status: 'pending' | 'completed' | 'failed';
    amount: number;
    currency: string;
    recipient: {
      phoneNumber: string;
      firstName?: string;
      lastName?: string;
    };
    metadata?: Record<string, any>;
    created: string;
  };
  error?: {
    code: number;
    reason: string | null;
    message: string;
    details: any[];
  };
}

export async function createPayout(data: MonimePayoutRequest): Promise<MonimePayoutResponse> {
  try {
    // Generate a unique idempotency key
    const idempotencyKey = `payout-${data.recipient.phoneNumber}-${Date.now()}`;
    
    const payoutPayload = {
      amount: {
        currency: 'SLE', // Use SLE for Sierra Leone Leone
        value: Math.round(data.amount) // Ensure it's an integer
      },
      destination: {
        providerCode: 'm17', // Default provider for Sierra Leone
        accountId: data.recipient.phoneNumber
      },
      // Remove source field - Monime will use default financial account
      metadata: {
        ...data.metadata,
        source: 'sendHome',
        environment: process.env.NODE_ENV,
        firstName: data.recipient.firstName,
        lastName: data.recipient.lastName,
        description: data.description,
      }
    };

    console.log('Monime payout payload:', payoutPayload);

    const response = await fetch('https://api.monime.io/payouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MONIME_API_KEY}`,
        'Content-Type': 'application/json',
        'Monime-Space-Id': env.MONIME_SPACE_ID!,
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payoutPayload),
    });

    const result = await response.json();
    console.log('Monime API response:', result);

    if (!response.ok || !result.success) {
      throw {
        success: false,
        error: {
          code: response.status,
          message: result.error?.message || 'Failed to create payout',
          reason: result.error?.reason || null,
          details: result.error?.details || [],
        },
      };
    }

    return {
      success: true,
      data: result.result, // Monime returns data in 'result' field
    };
  } catch (error: any) {
    console.error('Monime payout error:', error);
    return {
      success: false,
      error: {
        code: error.code || 500,
        message: error.message || 'Internal server error',
        reason: error.reason || null,
        details: error.details || [],
      },
    };
  }
}

export async function getPayoutStatus(payoutId: string): Promise<MonimePayoutResponse> {
  try {
    const response = await fetch(`https://api.monime.io/payouts/${payoutId}`, {
      headers: {
        'Authorization': `Bearer ${env.MONIME_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw {
        success: false,
        error: {
          code: response.status,
          message: result.error?.message || 'Failed to get payout status',
          reason: result.error?.reason || null,
          details: result.error?.details || [],
        },
      };
    }

    return {
      success: true,
      data: result,
    };
  } catch (error: any) {
    console.error('Monime payout status error:', error);
    return {
      success: false,
      error: {
        code: error.code || 500,
        message: error.message || 'Internal server error',
        reason: error.reason || null,
        details: error.details || [],
      },
    };
  }
}
