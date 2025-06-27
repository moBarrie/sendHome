import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test with a small payout to verify API connection and funds
    const testPayload = {
      amount: {
        currency: "SLE",
        value: 1000, // Very small test amount (1000 SLE ≈ £0.036)
      },
      destination: { 
        providerCode: "m17", 
        accountId: "+23276000000" // Invalid number so it won't actually send
      },
      metadata: { 
        test: "connection-check",
        timestamp: new Date().toISOString()
      },
    };

    console.log('🧪 Testing Monime API with payload:', JSON.stringify(testPayload, null, 2));

    const payoutResponse = await fetch("https://api.monime.io/payouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MONIME_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `test-${Date.now()}`,
        "Monime-Space-Id": process.env.MONIME_SPACE_ID || '',
      },
      body: JSON.stringify(testPayload),
    });

    const payoutData = await payoutResponse.json();
    console.log('💸 Test payout response:', JSON.stringify(payoutData, null, 2));

    if (payoutResponse.ok) {
      // Check the response for clues about account status
      if (payoutData.success && payoutData.result) {
        const { status, failureDetail } = payoutData.result;
        
        if (status === 'failed' && failureDetail?.code === 'fundInsufficient') {
          return res.json({
            success: false,
            error: 'Insufficient funds in Monime account',
            details: {
              message: 'API connection works, but account needs funding',
              issue: 'INSUFFICIENT_FUNDS',
              failureDetail
            }
          });
        } else if (status === 'failed' && failureDetail?.code === 'invalidDestination') {
          // This is actually good - means API works and has funds, just invalid phone number
          return res.json({
            success: true,
            message: 'Monime connection successful - account has funds',
            details: {
              message: 'API working correctly, failed due to invalid test phone number (expected)',
              accountStatus: 'FUNDED'
            }
          });
        } else {
          return res.json({
            success: true,
            message: 'Monime connection successful',
            details: payoutData
          });
        }
      } else {
        return res.json({
          success: true,
          message: 'Monime API responding',
          details: payoutData
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: `API test failed: ${payoutData.error?.message || 'Unknown error'}`,
        details: payoutData
      });
    }

  } catch (error: any) {
    console.error('❌ Monime connection test error:', error);
    return res.status(500).json({
      success: false,
      error: `Connection failed: ${error.message || 'Unknown error'}`,
    });
  }
}
