import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use the service role key for server-side RLS bypass
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, phoneNumber, recipientId, amountSll, gbpToSll, userId, paymentMethod } = req.body;
  if (!amount || !phoneNumber || !recipientId || !amountSll || !gbpToSll || !userId || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Calculate SendHome fee (5%)
    const sendHomeFee = Number(amount) * 0.05;

    // Calculate fixed fee (5%)
    const fixedFee = Number(amount) * 0.05;
    const totalGbp = Number(amount) + fixedFee;

    // Stripe expects amount in the smallest currency unit (e.g., pence for GBP)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100), // GBP to pence
      currency: 'gbp',
      payment_method_types: ['card'],
      metadata: { phoneNumber },
    });

    // Use userId from request body (already authenticated on client)
    // Create a transfer record in Supabase
    const { data, error } = await supabase
      .from('transfers')
      .insert([
        {
          user_id: userId,
          recipient_id: recipientId,
          amount_gbp: amount,
          amount_sll: amountSll,
          gbp_to_sll_rate: gbpToSll,
          status: 'pending',
          stripe_payment_intent_id: paymentIntent.id,
          sendhome_fee_gbp: sendHomeFee,
          stripe_fee_gbp: null, // To be filled in after payment via webhook
          payment_method: paymentMethod,
          fee_gbp: fixedFee, // Fixed 5% fee
          total_gbp: totalGbp, // Amount + fee
        },
      ])
      .select()
      .single();

    if (error) throw error;
    const transferId = data.id;

    return res.status(200).json({ clientSecret: paymentIntent.client_secret, transferId, paymentIntentId: paymentIntent.id });
  } catch (error: any) {
    console.error('Stripe error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
