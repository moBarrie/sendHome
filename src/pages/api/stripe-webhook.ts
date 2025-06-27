import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { buffer } from 'micro';
import { createClient } from '@supabase/supabase-js';
import { validateSierraLeonePhone } from '../../lib/sierra-leone-networks.js';

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
  console.log('=== MONIME PAYOUT DEBUG ===');
  console.log('Input parameters:', {
    phone,
    amount,
    providerCode,
    stripePaymentIntentId
  });
  
  // Validate Sierra Leone phone number
  let phoneValidation;
  try {
    phoneValidation = validateSierraLeonePhone(phone);
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
    
    if (phoneValidation.warning) {
      console.warn('⚠️ Phone warning:', phoneValidation.warning);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Phone validation failed:', errorMessage);
    throw new Error(errorMessage);
  }
  
  const formattedPhone = phoneValidation.localFormat;
  
  console.log('Environment variables:', {
    MONIME_SPACE_ID: process.env.MONIME_SPACE_ID,
    MONIME_API_KEY: process.env.MONIME_API_KEY?.substring(0, 10) + '...',
    MONIME_FINANCIAL_ACCOUNT_ID: process.env.MONIME_FINANCIAL_ACCOUNT_ID
  });
  
  // Validate inputs
  if (!amount || amount <= 0) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  
  if (!phone) {
    throw new Error(`Invalid phone: ${phone}`);
  }
  
  // Generate a unique idempotency key for this request
  const idempotencyKey = `${stripePaymentIntentId}-${Date.now()}`;
  
  const payoutPayload = {
    amount: { 
      currency: 'SLE', // Use SLE (new Sierra Leone Leone code) instead of SLL
      value: Math.round(Number(amount)) // Ensure it's an integer
    },
    destination: { 
      providerCode: providerCode || 'm17', 
      accountId: formattedPhone 
    },
    // Remove source field - Monime will use default financial account
    metadata: { 
      stripePaymentIntentId,
      source: 'sendHome-webhook',
      createdAt: new Date().toISOString(),
      originalAmount: String(amount),
      convertedAmount: String(Math.round(Number(amount)))
    }
  };
  
  console.log('=== WEBHOOK PAYOUT DEBUG ===');
  console.log('Input parameters:', { phone, amount, providerCode, stripePaymentIntentId });
  console.log('Input amount:', amount, 'Type:', typeof amount);
  console.log('Converted amount:', Math.round(Number(amount)));
  console.log('Final payout payload before JSON.stringify:', payoutPayload);
  console.log('Payload currency check:', payoutPayload.amount.currency);
  console.log('Payload amount value:', payoutPayload.amount.value);
  console.log('JSON.stringify test:', JSON.stringify(payoutPayload, null, 2));
  console.log('=== END WEBHOOK PAYOUT DEBUG ===');
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.MONIME_API_KEY}`,
    'Monime-Space-Id': process.env.MONIME_SPACE_ID!,
    'Idempotency-Key': idempotencyKey,
  };
  
  console.log('Request headers:', {
    'Content-Type': headers['Content-Type'],
    'Authorization': headers['Authorization']?.substring(0, 20) + '...',
    'Monime-Space-Id': headers['Monime-Space-Id'],
    'Idempotency-Key': headers['Idempotency-Key']
  });
  
  try {
    const res = await fetch('https://api.monime.io/payouts', {
      method: 'POST',
      headers,
      body: JSON.stringify(payoutPayload),
    });
    
    console.log('Response status:', res.status);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));
    
    const result = await res.json();
    console.log('Monime API response:', JSON.stringify(result, null, 2));
    console.log('=== END MONIME PAYOUT DEBUG ===');
    
    return result;
  } catch (error) {
    console.error('Fetch error:', error);
    console.log('=== END MONIME PAYOUT DEBUG ===');
    throw error;
  }
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
    console.log('Processing payment_intent.succeeded for:', paymentIntentId);
    
    try {
      // Find the transfer in Supabase
      const { data: transfer, error } = await supabase
        .from('transfers')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .single();
        
      if (error || !transfer) {
        console.error('Transfer not found:', error, 'for payment intent:', paymentIntentId);
        throw error || new Error('Transfer not found');
      }
      
      console.log('Found transfer:', {
        id: transfer.id,
        amount_sll: transfer.amount_sll,
        recipient_phone: transfer.recipient_phone,
        provider_code: transfer.provider_code,
        currency: transfer.currency,
        amount_gbp: transfer.amount_gbp,
        gbp_to_sll_rate: transfer.gbp_to_sll_rate
      });

      // Ensure we have the required data
      if (!transfer.amount_sll || !transfer.recipient_phone) {
        console.error('Missing required transfer data:', {
          amount_sll: transfer.amount_sll,
          recipient_phone: transfer.recipient_phone,
          transfer_id: transfer.id
        });
        throw new Error('Missing required transfer data');
      }

      console.log('About to call payoutWithMonime with:', {
        phone: transfer.recipient_phone,
        amount: transfer.amount_sll,
        providerCode: transfer.provider_code || 'm17',
        paymentIntentId: paymentIntentId
      });

      // Notify Monime space with recipient details to trigger payout
      const payoutResult = await payoutWithMonime(
        transfer.recipient_phone,
        transfer.amount_sll,
        transfer.provider_code || 'm17',
        paymentIntentId
      );
      
      console.log('Monime payout response:', payoutResult);

      // Update transfer with payout result
      const updateData = {
        status: payoutResult.success ? 'processing' : 'failed',
        payout_id: payoutResult.result?.id || null,
        metadata: {
          ...transfer.metadata,
          payout_response: payoutResult,
          payout_created_at: new Date().toISOString()
        }
      };
      
      console.log('Updating transfer with:', updateData);

      await supabase
        .from('transfers')
        .update(updateData)
        .eq('id', transfer.id);
        
    } catch (err) {
      console.error('Error handling payout:', err);
      // Don't throw here to avoid webhook retries
    }
  }

  res.status(200).json({ received: true });
}
