import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const config = {
  api: {
    bodyParser: false,
  },
};

async function payoutWithMonime(phone: string, amount: number, providerCode: string, stripePaymentIntentId: string) {
  console.log('MONIME_SPACE_ID being sent:', process.env.MONIME_SPACE_ID);
  const res = await fetch(process.env.MONIME_API_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MONIME_API_KEY}`,
      'Monime-Space-Id': process.env.MONIME_SPACE_ID!,
    },
    body: JSON.stringify({
      amount: { currency: 'SLL', value: amount },
      destination: { providerCode, accountId: phone },
      metadata: { stripePaymentIntentId },
    }),
  });
  return res.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentIntentId = paymentIntent.id;
    try {
      // Find the transfer in Supabase
      const { data: transfer, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();
      if (error || !transfer) throw error || new Error('Transfer not found');

      // Notify Monime space with recipient details to trigger payout
      const payoutResult = await payoutWithMonime(
        transfer.recipient_phone,
        transfer.amount_sll,
        transfer.provider_code || 'm17',
        paymentIntentId
      );
      console.log('Monime payout payload:', {
        amount: { currency: 'SLL', value: transfer.amount_sll },
        destination: { providerCode: transfer.provider_code || 'm17', accountId: transfer.recipient_phone },
        metadata: { stripePaymentIntentId: paymentIntentId },
      });
      console.log('Monime payout response:', payoutResult);

      // Update transfer with payout result and mark as completed
      await supabase
        .from('transfers')
        .update({
          status: 'completed',
          payout_status: payoutResult.status,
          payout_transaction_id: payoutResult.transaction_id,
          payout_response: payoutResult,
        })
        .eq('id', transfer.id);
    } catch (err) {
      console.error('Error handling payout:', err);
    }
  }

  res.status(200).json({ received: true });
}
