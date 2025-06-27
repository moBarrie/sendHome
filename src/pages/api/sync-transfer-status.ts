import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { fetchMonimePayouts, mapMonimeStatusToTransferStatus } from '@/lib/monime-status';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Starting transfer status sync with Monime...');

    // Fetch all recent payouts from Monime
    const payouts = await fetchMonimePayouts(100, 0);

    if (!payouts.success || !payouts.result) {
      console.error('❌ Failed to fetch Monime payouts:', payouts.error);
      return res.status(400).json({
        error: 'Failed to fetch payouts from Monime',
        details: payouts.error
      });
    }

    console.log(`📊 Found ${payouts.result.length} payouts from Monime`);

    // Get all transfers from our database that might need updating
    const { data: transfers, error: transferError } = await supabase
      .from('transfers')
      .select('*')
      .in('status', ['pending', 'processing'])
      .not('monime_payout_id', 'is', null);

    if (transferError) {
      console.error('❌ Error fetching transfers:', transferError);
      return res.status(500).json({ error: 'Failed to fetch transfers' });
    }

    console.log(`📊 Found ${transfers?.length || 0} transfers to potentially update`);

    const updates = [];
    const transferMap = new Map(transfers?.map(t => [t.monime_payout_id, t]) || []);

    // Check each Monime payout against our transfers
    for (const payout of payouts.result) {
      const transfer = transferMap.get(payout.id);
      
      if (transfer) {
        const newStatus = mapMonimeStatusToTransferStatus(payout.status);
        
        if (transfer.status !== newStatus) {
          console.log(`🔄 Updating transfer ${transfer.id}: ${transfer.status} → ${newStatus}`);
          
          const updateData: any = {
            status: newStatus,
            updated_at: new Date().toISOString(),
          };

          // Add failure details if the payout failed
          if (payout.status === 'failed' && payout.failureDetail) {
            updateData.failure_reason = payout.failureDetail.message;
          }

          // Add transaction reference if completed
          if (payout.status === 'completed' && payout.destination.transactionReference) {
            updateData.transaction_reference = payout.destination.transactionReference;
          }

          const { error: updateError } = await supabase
            .from('transfers')
            .update(updateData)
            .eq('id', transfer.id);

          if (updateError) {
            console.error(`❌ Error updating transfer ${transfer.id}:`, updateError);
          } else {
            updates.push({
              transferId: transfer.id,
              payoutId: payout.id,
              oldStatus: transfer.status,
              newStatus: newStatus,
              monimeStatus: payout.status
            });
          }
        }
      }
    }

    console.log(`✅ Successfully updated ${updates.length} transfers`);

    res.status(200).json({
      success: true,
      message: `Updated ${updates.length} transfers`,
      updates: updates,
      totalPayouts: payouts.result.length,
      totalTransfers: transfers?.length || 0
    });

  } catch (error) {
    console.error('❌ Error in sync-transfer-status API:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
