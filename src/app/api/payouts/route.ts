import { createPayout, SUPPORTED_CURRENCIES, MIN_AMOUNTS, MAX_AMOUNTS, MonimeError } from '@/lib/monime';
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

function validateAmount(amount: number, currency: string) {
  if (!SUPPORTED_CURRENCIES.includes(currency as any)) {
    throw new MonimeError(
      400,
      `Currency '${currency}' is not supported. Supported currencies: ${SUPPORTED_CURRENCIES.join(', ')}`
    );
  }

  const minAmount = MIN_AMOUNTS[currency as keyof typeof MIN_AMOUNTS];
  const maxAmount = MAX_AMOUNTS[currency as keyof typeof MAX_AMOUNTS];

  if (amount < minAmount) {
    throw new MonimeError(
      400,
      `Amount is below minimum for ${currency}. Minimum amount: ${minAmount}`
    );
  }

  if (amount > maxAmount) {
    throw new MonimeError(
      400,
      `Amount is above maximum for ${currency}. Maximum amount: ${maxAmount}`
    );
  }
}

function validatePhoneNumber(phoneNumber: string) {
  // Basic phone number validation - you might want to make this more sophisticated
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  if (!phoneRegex.test(phoneNumber)) {
    throw new MonimeError(
      400,
      'Invalid phone number format. Please use international format (e.g., +1234567890)'
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, phoneNumber, currency, description, userId, paymentIntentId } = body;

    // Validate required fields
    if (!amount || !phoneNumber || !currency || !userId || !paymentIntentId) {
      throw new MonimeError(400, 'Missing required fields', null, [
        'amount, phoneNumber, currency, userId, and paymentIntentId are required',
      ]);
    }

    // Validate amount and currency
    validateAmount(amount, currency.toUpperCase());
    
    // Validate phone number
    validatePhoneNumber(phoneNumber);

    // Check user's KYC status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new MonimeError(400, 'User profile not found');
    }

    if (profile.kyc_status !== 'approved') {
      throw new MonimeError(
        403,
        'KYC approval required',
        'incomplete_kyc',
        ['Please complete KYC verification before making transfers']
      );
    }

    // Create payout through Monime
    const payoutResult = await createPayout({
      amount,
      currency,
      recipient: {
        phoneNumber,
      },
      description,
      metadata: {
        userId,
      },
    });

    if (!payoutResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: payoutResult.error,
        },
        { status: payoutResult.error?.code || 500 }
      );
    }

    // Create transfer record in database
    const { error: dbError } = await supabase
      .from('transfers')
      .insert({
        user_id: userId,
        amount,
        currency,
        recipient_phone: phoneNumber,
        status: 'processing',
        payout_id: payoutResult.data?.id,
        description,
        metadata: {
          monime_status: payoutResult.data?.status,
          created_at: payoutResult.data?.created,
        },
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Even if DB insert fails, return success since payout was created
      return NextResponse.json({
        success: true,
        warning: 'Transfer record creation failed',
        data: payoutResult.data,
      });
    }

    return NextResponse.json({
      success: true,
      data: payoutResult.data,
    });
  } catch (error: any) {
    console.error('Payout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const payoutId = searchParams.get('id');

    if (!payoutId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Payout ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Get latest transfer status from database
    const { data: transfer, error: dbError } = await supabase
      .from('transfers')
      .select('*')
      .eq('payout_id', payoutId)
      .single();

    if (dbError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Failed to fetch transfer',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: transfer,
    });
  } catch (error: any) {
    console.error('Payout status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
