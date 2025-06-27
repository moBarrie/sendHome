// Monime payout status tracking utilities

export interface MonimePayoutStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: {
    value: number;
    currency: string;
  };
  destination: {
    providerCode: string;
    accountId: string;
    transactionReference?: string;
  };
  source: {
    financialAccountId: string;
    transactionReference?: string;
  };
  charges: any[];
  failureDetail?: {
    code: string;
    message: string;
    details: any[];
  };
  createTime: string;
  updateTime?: string;
  metadata?: Record<string, any>;
}

export interface MonimePayoutListResponse {
  success: boolean;
  result?: MonimePayoutStatus[];
  pagination?: {
    count: number;
    total: number | null;
    next?: string;
  };
  error?: {
    code: number;
    message: string;
    reason?: string;
    details: any[];
  };
}

// Map Monime status to our transfer status
export function mapMonimeStatusToTransferStatus(monimeStatus: string): string {
  switch (monimeStatus) {
    case 'completed':
      return 'completed';
    case 'failed':
    case 'cancelled':
      return 'failed';
    case 'pending':
    case 'processing':
      return 'processing';
    default:
      return 'pending';
  }
}

// Fetch all payouts from Monime
export async function fetchMonimePayouts(
  limit: number = 100,
  offset: number = 0
): Promise<MonimePayoutListResponse> {
  try {
    const response = await fetch(`https://api.monime.io/payouts?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MONIME_API_KEY}`,
        'Content-Type': 'application/json',
        'Monime-Space-Id': process.env.MONIME_SPACE_ID!,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Monime API error: ${result.error?.message || 'Unknown error'}`);
    }

    return result;
  } catch (error) {
    console.error('Error fetching Monime payouts:', error);
    throw error;
  }
}

// Get specific payout by ID
export async function fetchMonimePayout(payoutId: string): Promise<MonimePayoutStatus> {
  try {
    const response = await fetch(`https://api.monime.io/payouts/${payoutId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MONIME_API_KEY}`,
        'Content-Type': 'application/json',
        'Monime-Space-Id': process.env.MONIME_SPACE_ID!,
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`Monime API error: ${result.error?.message || 'Unknown error'}`);
    }

    return result.result;
  } catch (error) {
    console.error('Error fetching Monime payout:', error);
    throw error;
  }
}
