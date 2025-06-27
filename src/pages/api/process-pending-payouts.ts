import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function payoutWithMonime(phone: string, amount: number) {
  // Generate a unique idempotency key for this request
  const idempotencyKey = `pending-${phone}-${amount}-${Date.now()}`;
  
  const payoutPayload = {
    amount: { 
      currency: 'SLE', // Use SLE (new Sierra Leone Leone code) instead of SLL
      value: Math.round(amount) // Ensure it's an integer
    },
    destination: { 
      providerCode: 'm17', // Default provider code for Sierra Leone
      accountId: phone 
    },
    // Remove source field - Monime will use default financial account
    metadata: { 
      source: 'sendHome-pending-processing',
      processedAt: new Date().toISOString()
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
      // 3. Update transfer to completed
      await supabase
        .from('transfers')
        .update({
          status: 'completed',
          payout_status: payoutResult.status,
          payout_transaction_id: payoutResult.transaction_id,
          payout_response: payoutResult,
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
