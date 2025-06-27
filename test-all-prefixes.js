#!/usr/bin/env node

// Test multiple Sierra Leone prefixes with Monime API
const https = require('https');

const MONIME_API_KEY = process.env.MONIME_API_KEY;
const MONIME_SPACE_ID = process.env.MONIME_SPACE_ID;

if (!MONIME_API_KEY || !MONIME_SPACE_ID) {
  console.error('❌ Missing environment variables. Please set MONIME_API_KEY and MONIME_SPACE_ID');
  process.exit(1);
}

// Test cases for different networks and prefixes
const TEST_CASES = [
  // Known working
  { prefix: '73', network: 'Airtel', phone: '73123456', expected: 'working' },
  { prefix: '76', network: 'Africell', phone: '76123456', expected: 'working' },
  { prefix: '78', network: 'Airtel', phone: '78123456', expected: 'working' },
  { prefix: '79', network: 'Airtel', phone: '79123456', expected: 'working' },

  // Need to test
  { prefix: '70', network: 'Airtel', phone: '70123456', expected: 'unknown' },
  { prefix: '72', network: 'Airtel', phone: '72123456', expected: 'unknown' },
  { prefix: '74', network: 'Airtel', phone: '74123456', expected: 'unknown' },
  { prefix: '75', network: 'Airtel', phone: '75123456', expected: 'unknown' },
  { prefix: '77', network: 'Africell', phone: '77123456', expected: 'unknown' },
  { prefix: '88', network: 'Africell', phone: '88123456', expected: 'unknown' },
  
  // Other networks
  { prefix: '30', network: 'Orange', phone: '30123456', expected: 'unknown' },
  { prefix: '33', network: 'Orange', phone: '33123456', expected: 'unknown' },
  { prefix: '25', network: 'QCell', phone: '25123456', expected: 'unknown' },
  { prefix: '95', network: 'QCell', phone: '95123456', expected: 'unknown' },
  { prefix: '99', network: 'QCell', phone: '99123456', expected: 'unknown' },
];

async function testMonimePrefix(testCase) {
  const testAmount = 100; // 1.00 SLE in smallest unit
  
  console.log(`\n🧪 Testing ${testCase.network} prefix ${testCase.prefix}`);
  console.log(`📱 Phone: +232${testCase.phone}`);
  
  const payoutData = {
    amount: {
      value: testAmount,
      currency: 'SLE'
    },
    destination: {
      providerCode: 'm17',
      accountId: testCase.phone
    },
    metadata: {
      source: 'sendHome',
      environment: 'test',
      firstName: 'Test',
      lastName: `User ${testCase.prefix}`,
      description: `Test payout for prefix ${testCase.prefix}`,
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
      'Idempotency-Key': `test-${testCase.prefix}-${Date.now()}-${Math.random()}`
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const responseJson = JSON.parse(data);
          
          const result = {
            prefix: testCase.prefix,
            network: testCase.network,
            phone: testCase.phone,
            status: res.statusCode,
            success: res.statusCode === 200 || res.statusCode === 201,
            response: responseJson
          };

          if (result.success) {
            console.log(`✅ SUCCESS: ${testCase.network} prefix ${testCase.prefix} works!`);
          } else {
            console.log(`❌ FAILED: ${testCase.network} prefix ${testCase.prefix}`);
            console.log(`   Error: ${responseJson.error?.message || 'Unknown error'}`);
          }
          
          resolve(result);
        } catch (error) {
          console.log(`❌ PARSE ERROR for prefix ${testCase.prefix}:`, data);
          resolve({
            prefix: testCase.prefix,
            network: testCase.network,
            phone: testCase.phone,
            status: res.statusCode,
            success: false,
            error: 'Parse error'
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ REQUEST ERROR for prefix ${testCase.prefix}:`, error);
      resolve({
        prefix: testCase.prefix,
        network: testCase.network,
        phone: testCase.phone,
        success: false,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

async function testAllPrefixes() {
  console.log('🚀 Testing Sierra Leone Prefixes with Monime API');
  console.log('=' .repeat(60));
  
  const results = [];
  
  // Test each prefix with a delay to avoid rate limiting
  for (const testCase of TEST_CASES) {
    const result = await testMonimePrefix(testCase);
    results.push(result);
    
    // Wait 2 seconds between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n📊 SUMMARY OF RESULTS');
  console.log('=' .repeat(60));
  
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n✅ WORKING PREFIXES (${working.length}):`);
  working.forEach(r => {
    console.log(`   ${r.prefix} - ${r.network}`);
  });
  
  console.log(`\n❌ FAILED PREFIXES (${failed.length}):`);
  failed.forEach(r => {
    console.log(`   ${r.prefix} - ${r.network} (${r.error || 'API error'})`);
  });
  
  console.log('\n💡 Next steps:');
  console.log('1. Update sierra-leone-networks.js with working prefixes');
  console.log('2. Mark working prefixes as working: true');
  console.log('3. Consider testing remaining prefixes later');
  
  return results;
}

// Run the tests
testAllPrefixes().catch(console.error);
