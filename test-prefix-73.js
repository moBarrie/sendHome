#!/usr/bin/env node

// Test the 73 prefix specifically with Monime API
const https = require('https');

const MONIME_API_KEY = process.env.MONIME_API_KEY;
const MONIME_SPACE_ID = process.env.MONIME_SPACE_ID;

if (!MONIME_API_KEY || !MONIME_SPACE_ID) {
  console.error('❌ Missing environment variables. Please set MONIME_API_KEY and MONIME_SPACE_ID');
  process.exit(1);
}

async function testPrefix73() {
  const testPhone = '73496053'; // The problematic number
  const testAmount = 100; // 1.00 SLE in smallest unit
  
  console.log('🧪 Testing Airtel prefix 73 with Monime API');
  console.log('📱 Phone number:', testPhone);
  console.log('💰 Amount:', testAmount, '(1.00 SLE)');
  console.log('🔧 Provider code: m17');
  
  const payoutData = {
    amount: {
      value: testAmount,
      currency: 'SLE'
    },
    destination: {
      providerCode: 'm17',
      accountId: testPhone
    },
    metadata: {
      source: 'sendHome',
      environment: 'test',
      firstName: 'Test',
      lastName: 'User 73',
      description: 'Test payout for prefix 73',
    }
  };

  const postData = JSON.stringify(payoutData);
  
  const options = {
    hostname: 'api.monime.io',
    port: 443,
    path: '/payouts',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MONIME_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Monime-Space-Id': MONIME_SPACE_ID,
      'Idempotency-Key': `test-73-${Date.now()}-${Math.random()}`
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📊 Response status:', res.statusCode);
        console.log('📨 Response headers:', res.headers);
        
        try {
          const responseJson = JSON.parse(data);
          console.log('📨 Response body:', JSON.stringify(responseJson, null, 2));
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ SUCCESS: Prefix 73 works with Monime!');
            resolve(responseJson);
          } else {
            console.log('❌ FAILED: Prefix 73 does not work with Monime');
            console.log('💡 Error details:', responseJson.error || responseJson);
            resolve(responseJson);
          }
        } catch (error) {
          console.log('❌ Failed to parse response:', data);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    console.log('📤 Sending request to Monime...');
    console.log('📤 Request payload:', JSON.stringify(payoutData, null, 2));
    req.write(postData);
    req.end();
  });
}

// Run the test
testPrefix73().catch(console.error);
