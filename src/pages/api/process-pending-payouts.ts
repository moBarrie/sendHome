import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function payoutWithMonime(phone: string, amount: number) {
  // Replace with your Monime API endpoint and auth
  const res = await fetch(process.env.MONIME_API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MONIME_API_KEY}`,
    },
    body: JSON.stringify({
      phone,
      amount,
      currency: 'SLL',
    }),
  });
  return res.json();
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
