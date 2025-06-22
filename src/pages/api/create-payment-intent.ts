import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { setSupabaseAuthHeader } from '@/lib/supabase';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-05-28.basil',
});

// Initialize Firebase if not already initialized
if (!getApps().length) {
  initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, phoneNumber, recipientId, amountSll, gbpToSll } = req.body;
  if (!amount || !phoneNumber || !recipientId || !amountSll || !gbpToSll) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Stripe expects amount in the smallest currency unit (e.g., pence for GBP)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100), // GBP to pence
      currency: 'gbp',
      payment_method_types: ['card'],
      metadata: { phoneNumber },
    });

    // Get the Firebase ID token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No authorization token found');
    }
    
    const token = authHeader.split('Bearer ')[1];
    console.debug('[create-payment-intent] Setting Supabase session with token:', token.substring(0, 10) + '...');
    const { data: session, error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: '' // No refresh token for external JWT
    });
    
    if (sessionError) {
      console.error('[create-payment-intent] Failed to set session:', sessionError);
      throw new Error('Failed to authenticate with Supabase');
    }
    console.debug('[create-payment-intent] Session set successfully:', session);

    // Get the user ID from the Supabase session
    console.debug('[create-payment-intent] Getting authenticated user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('[create-payment-intent] Failed to get user:', userError);
      throw new Error('Failed to get authenticated user: ' + userError.message);
    }
    
    if (!user) {
      console.error('[create-payment-intent] No user found in session');
      throw new Error('Failed to get authenticated user: No user found in session');
    }
    
    console.debug('[create-payment-intent] Got authenticated user:', user.id);

    // Create a transfer record in Supabase
    const { data, error } = await supabase
      .from('transfers')
      .insert([
        {
          user_id: user.id,
          recipient_id: recipientId,
          amount_gbp: amount,
          amount_sll: amountSll,
          gbp_to_sll_rate: gbpToSll,
          status: 'pending',
          stripe_payment_intent_id: paymentIntent.id,
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
