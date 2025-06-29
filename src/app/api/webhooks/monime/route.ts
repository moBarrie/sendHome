import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Create server-side client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('monime-signature');

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(
      body,
      signature,
      process.env.MONIME_WEBHOOK_SECRET!
    );

    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Handle different webhook events
    switch (event.type) {
      case 'payout.completed':
        await handlePayoutCompleted(event.data);
        break;
      case 'payout.failed':
        await handlePayoutFailed(event.data);
        break;
      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const hmac = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(hmac)
  );
}

async function handlePayoutCompleted(data: any) {
  const { error } = await supabase
    .from('transfers')
    .update({
      status: 'completed',
      metadata: {
        monime_status: 'completed',
        completed_at: new Date().toISOString(),
        payout_data: data,
      },
    })
    .eq('payout_id', data.id);

  if (error) {
    console.error('Failed to update transfer:', error);
    throw error;
  }

  // Notify user about completed transfer (you can implement this)
  await notifyUser(data.id, 'completed');
}

async function handlePayoutFailed(data: any) {
  const { error } = await supabase
    .from('transfers')
    .update({
      status: 'failed',
      metadata: {
        monime_status: 'failed',
        failed_at: new Date().toISOString(),
        failure_reason: data.failure_reason,
        payout_data: data,
      },
    })
    .eq('payout_id', data.id);

  if (error) {
    console.error('Failed to update transfer:', error);
    throw error;
  }

  // Notify user about failed transfer (you can implement this)
  await notifyUser(data.id, 'failed');
}

async function notifyUser(payoutId: string, status: 'completed' | 'failed') {
  try {
    const { data: transfer } = await supabase
      .from('transfers')
      .select('*, profiles(email)')
      .eq('payout_id', payoutId)
      .single();

    if (!transfer) return;

    // You can implement your notification logic here
    // For example, send an email or push notification
    console.log(`Transfer ${status} for user:`, transfer.profiles.email);
  } catch (error) {
    console.error('Failed to notify user:', error);
  }
}
