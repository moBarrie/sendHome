import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, phoneNumber, recipientId, amountSll, gbpToSll, userId, paymentMethod } = req.body;
  if (!amount || !phoneNumber || !recipientId || !amountSll || !gbpToSll || !userId || !paymentMethod) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const numericAmount = Number(amount);
  if (isNaN(numericAmount) || numericAmount < 1) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    // KYC enforcement: block transfers over 300 unless KYC is approved
    if (numericAmount > 300) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('kyc_status')
        .eq('id', userId)
        .single();

      if (profileError) {
        // Handle the case where no profile exists for the user
        if (profileError.code === 'PGRST116') {
          console.log('[KYC] No profile found for user, creating new profile with pending KYC:', userId);
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ id: userId, kyc_status: 'pending' });
          if (insertError) {
            console.error('[KYC] Failed to create new profile for user:', insertError);
            return res.status(500).json({ error: 'Failed to create user profile for KYC check. Please try again or contact support.' });
          }
          // Always return after creating a pending profile
          return res.status(403).json({
            error: 'KYC not completed. Please submit your KYC information to proceed with payments.',
            kyc_status: 'pending',
          });
        }
        // Unexpected error
        console.error('[KYC] Unexpected profile fetch error:', profileError, 'userId:', userId);
        return res.status(500).json({ error: 'Failed to fetch user profile for KYC check. Please try again or contact support.' });
      }
      if (!profile || profile.kyc_status !== 'approved') {
        console.warn('KYC not approved for user:', userId, 'profile:', profile);
        return res.status(403).json({ error: 'KYC approval required to send more than 300' });
      }
    }

    // Calculate fees
    const sendHomeFee = numericAmount * 0.05;
    const fixedFee = numericAmount * 0.05;
    const totalGbp = numericAmount + fixedFee;

    // Get recipient details if recipientId is provided
    let recipientName = 'Recipient';
    let recipientPhone = phoneNumber;
    
    if (recipientId) {
      const { data: recipientData } = await supabase
        .from('recipients')
        .select('name, phone')
        .eq('id', recipientId)
        .single();
      
      if (recipientData) {
        recipientName = recipientData.name;
        recipientPhone = recipientData.phone;
      }
    }

    // Stripe expects amount in pence
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(numericAmount * 100),
        currency: 'gbp',
        payment_method_types: ['card'],
        metadata: { phoneNumber },
      });
    } catch (stripeError) {
      console.error('Stripe paymentIntent error:', stripeError, 'amount:', numericAmount, 'userId:', userId);
      return res.status(500).json({ error: 'Stripe payment intent failed', details: stripeError });
    }

    // Create a transfer record in Supabase
    const { data, error } = await supabase
      .from('transfers')
      .insert([
        {
          user_id: userId,
          recipient_id: recipientId,
          recipient_name: recipientName,
          recipient_phone: recipientPhone,
          amount: numericAmount,
          amount_gbp: numericAmount,
          amount_sll: amountSll,
          gbp_to_sll_rate: gbpToSll,
          status: 'pending',
          stripe_payment_intent_id: paymentIntent.id,
          sendhome_fee_gbp: sendHomeFee,
          payment_method: paymentMethod,
          fee_gbp: fixedFee,
          total_gbp: totalGbp,
          currency: 'GBP',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase transfer insert error:', error, 'request:', req.body);
      throw error;
    }
    const transferId = data.id;

    return res.status(200).json({ clientSecret: paymentIntent.client_secret, transferId, paymentIntentId: paymentIntent.id });
  } catch (error: any) {
    console.error('Stripe or Supabase error:', error, 'request:', req.body);
    return res.status(500).json({ error: error.message || 'Internal server error', details: error });
  }
}
