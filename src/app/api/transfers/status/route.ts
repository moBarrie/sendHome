import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { env } from '@/env.mjs';

// Function to check transfer status with Monime
async function checkMonimeStatus(payoutId: string) {
  const response = await fetch(`${env.MONIME_API_URL}/${payoutId}`, {
    headers: {
      'Authorization': `Bearer ${env.MONIME_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to check payout status');
  }

  const data = await response.json();
  return data;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const transferId = searchParams.get('transferId');

    if (!transferId) {
      return NextResponse.json(
        { success: false, error: 'Transfer ID is required' },
        { status: 400 }
      );
    }

    // Get transfer from database
    const { data: transfer, error: dbError } = await supabase
      .from('transfers')
      .select('*')
      .eq('id', transferId)
      .single();

    if (dbError || !transfer) {
      return NextResponse.json(
        { success: false, error: 'Transfer not found' },
        { status: 404 }
      );
    }

    // Check status with Monime if we have a payout_id
    if (transfer.payout_id) {
      try {
        const monimeStatus = await checkMonimeStatus(transfer.payout_id);
        
        // Update transfer status if it's different
        if (monimeStatus.status !== transfer.status) {
          const { error: updateError } = await supabase
            .from('transfers')
            .update({
              status: monimeStatus.status,
              metadata: {
                ...transfer.metadata,
                monime_status: monimeStatus.status,
                last_checked: new Date().toISOString(),
              },
            })
            .eq('id', transferId);

          if (updateError) {
            console.error('Error updating transfer status:', updateError);
          }

          transfer.status = monimeStatus.status;
        }
      } catch (error) {
        console.error('Error checking Monime status:', error);
        // Don't fail the request, just return current status
      }
    }

    return NextResponse.json({
      success: true,
      data: transfer,
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check transfer status' },
      { status: 500 }
    );
  }
}
