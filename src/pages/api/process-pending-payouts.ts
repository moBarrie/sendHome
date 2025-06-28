import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { validateSierraLeonePhone } from '../../lib/sierra-leone-networks.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function payoutWithMonime(phone: string, amount: number) {
  // Validate and format phone number
  const phoneValidation = validateSierraLeonePhone(phone);
  if (!phoneValidation.valid) {
    throw new Error(`Invalid Sierra Leone phone number: ${phoneValidation.error}`);
  }
  
  console.log('📱 Phone validation:', {
    network: phoneValidation.network,
    prefix: phoneValidation.prefix,
    working: phoneValidation.working,
    originalPhone: phone,
    formattedPhone: phoneValidation.localFormat
  });
  
  const formattedPhone = phoneValidation.localFormat;
  
  // Generate a unique idempotency key for this request
  const idempotencyKey = `pending-${formattedPhone}-${amount}-${Date.now()}`;
  
  const payoutPayload = {
    amount: { 
      currency: 'SLE', // Use SLE (new Sierra Leone Leone code) instead of SLL
      value: Math.round(amount) // Ensure it's an integer
    },
    destination: { 
      providerCode: 'm17', // Default provider code for Sierra Leone
      accountId: formattedPhone 
    },
    // Remove source field - Monime will use default financial account
    metadata: { 
      source: 'sendHome-pending-processing',
      processedAt: new Date().toISOString(),
      network: phoneValidation.network,
      prefix: phoneValidation.prefix
    }
  };
  
  console.log('Monime payout payload:', payoutPayload);
  
  const res = await fetch('https://api.monime.io/payouts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MONIME_API_KEY}`,
      'Monime-Space-Id': process.env.MONIME_SPACE_ID!,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payoutPayload),
  });
  
  const result = await res.json();
  console.log('Monime API response:', result);
  
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }
  // 1. Get all pending transfers
  const { data: transfers, error } = await supabase
    .from('transfers')
    .select('*')
    .eq('status', 'pending');
  if (error) return res.status(500).json({ error: error.message });

  let processed = 0;
  for (const transfer of transfers || []) {
    try {
      // 2. Payout via Monime
      const payoutResult = await payoutWithMonime(transfer.recipient_phone, transfer.amount_sll);
      // 3. Update transfer with payout result
      await supabase
        .from('transfers')
        .update({
          status: payoutResult.success ? 'processing' : 'failed',
          monime_payout_id: payoutResult.result?.id || null,
          transaction_reference: payoutResult.result?.source?.transactionReference || null,
          failure_reason: payoutResult.result?.failureDetail?.message || null,
          metadata: {
            payout_response: payoutResult,
            payout_created_at: new Date().toISOString()
          }
        })
        .eq('id', transfer.id);
      processed++;
    } catch (err) {
      // Log and skip failed payouts
      console.error('Payout failed for transfer', transfer.id, err);
    }
  }
  res.status(200).json({ processed });
}
