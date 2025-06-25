import { supabase } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { createPayout, MonimeError } from '@/lib/monime';

interface TransferRequest {
  amount: number;
  currency: string;
  phoneNumber: string;
  description?: string;
  userId: string;
  paymentIntentId: string;
}

export async function handleTransferFlow(data: TransferRequest) {
  const { amount, currency, phoneNumber, description, userId, paymentIntentId } = data;
  let transferId: string | null = null;

  try {
    // 1. Verify payment intent status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not successful');
    }

    // 2. Create initial transfer record
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .insert({
        user_id: userId,
        amount,
        currency,
        recipient_phone: phoneNumber,
        status: 'processing',
        description,
        payment_intent_id: paymentIntentId,
        metadata: {
          payment_status: 'succeeded',
          payout_status: 'pending',
        },
      })
      .select()
      .single();

    if (transferError) throw transferError;
    transferId = transfer.id;

    // 3. Create payout through Monime
    const payoutResult = await createPayout({
      amount,
      currency,
      recipient: {
        phoneNumber,
      },
      description,
      metadata: {
        transferId: transfer.id,
        userId,
        paymentIntentId,
      },
    });

    if (!payoutResult.success) {
      // 4. Handle payout failure
      await handlePayoutFailure({
        transferId: transfer.id,
        paymentIntentId,
        error: payoutResult.error,
      });
      throw new Error(payoutResult.error?.message || 'Payout failed');
    }

    // 5. Update transfer record with payout info
    const { error: updateError } = await supabase
      .from('transfers')
      .update({
        status: 'processing',
        payout_id: payoutResult.data?.id,
        metadata: {
          ...transfer.metadata,
          payout_status: payoutResult.data?.status,
          payout_created_at: payoutResult.data?.created,
        },
      })
      .eq('id', transfer.id);

    if (updateError) throw updateError;

    return {
      success: true,
      data: {
        transferId: transfer.id,
        payoutId: payoutResult.data?.id,
        status: 'processing',
      },
    };

  } catch (error) {
    console.error('Transfer flow error:', error);
    
    // If we haven't created a transfer record yet, create one to track the failure
    if (!transferId) {
      await supabase
        .from('transfers')
        .insert({
          user_id: userId,
          amount,
          currency,
          recipient_phone: phoneNumber,
          status: 'failed',
          description,
          payment_intent_id: paymentIntentId,
          metadata: {
            payment_status: 'succeeded',
            payout_status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
    }

    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to process transfer',
        code: error instanceof MonimeError ? error.code : 500,
      },
    };
  }
}

async function handlePayoutFailure({
  transferId,
  paymentIntentId,
  error,
}: {
  transferId: string;
  paymentIntentId: string;
  error?: {
    code: number;
    message: string;
    reason?: string | null;
  };
}) {
  try {
    // 1. Update transfer record
    await supabase
      .from('transfers')
      .update({
        status: 'failed',
        metadata: {
          payment_status: 'refund_pending',
          payout_status: 'failed',
          failure_reason: error?.message,
          failure_code: error?.code,
        },
      })
      .eq('id', transferId);

    // 2. Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'failed_payout',
    });

    // 3. Update transfer record with refund info
    await supabase
      .from('transfers')
      .update({
        metadata: {
          payment_status: 'refunded',
          payout_status: 'failed',
          failure_reason: error?.message,
          failure_code: error?.code,
          refund_id: refund.id,
          refund_status: refund.status,
        },
      })
      .eq('id', transferId);

    // 4. Log the incident for review
    await supabase
      .from('transfer_incidents')
      .insert({
        transfer_id: transferId,
        payment_intent_id: paymentIntentId,
        type: 'payout_failure_with_refund',
        details: {
          error,
          refund_id: refund.id,
          refund_status: refund.status,
        },
      });

  } catch (refundError) {
    console.error('Refund process failed:', refundError);
    
    // Update transfer record to indicate manual intervention needed
    await supabase
      .from('transfers')
      .update({
        status: 'failed',
        metadata: {
          payment_status: 'refund_failed',
          payout_status: 'failed',
          failure_reason: error?.message,
          failure_code: error?.code,
          refund_error: refundError instanceof Error ? refundError.message : 'Unknown error',
          requires_manual_intervention: true,
        },
      })
      .eq('id', transferId);

    // Create high-priority incident
    await supabase
      .from('transfer_incidents')
      .insert({
        transfer_id: transferId,
        payment_intent_id: paymentIntentId,
        type: 'refund_failure',
        priority: 'high',
        details: {
          payout_error: error,
          refund_error: refundError,
        },
      });
  }
}
