#!/usr/bin/env node

// Test different Sierra Leone phone number prefixes with m17 provider
require("dotenv").config({ path: ".env.local" });

async function testPhonePrefixes() {
  console.log("📱 Testing Sierra Leone phone prefixes with m17 provider...\n");

  // Sierra Leone mobile prefixes by network
  const phoneTests = [
    // Africell prefixes
    { phone: "76123456", network: "Africell", prefix: "76" },
    { phone: "77123456", network: "Africell", prefix: "77" },
    { phone: "88123456", network: "Africell", prefix: "88" },

    // Orange prefixes
    { phone: "30123456", network: "Orange", prefix: "30" },
    { phone: "33123456", network: "Orange", prefix: "33" },
    { phone: "34123456", network: "Orange", prefix: "34" },

    // Airtel prefixes
    { phone: "70123456", network: "Airtel", prefix: "70" },
    { phone: "78123456", network: "Airtel", prefix: "78" },
    { phone: "79123456", network: "Airtel", prefix: "79" },

    // QCell prefixes
    { phone: "25123456", network: "QCell", prefix: "25" },
    { phone: "95123456", network: "QCell", prefix: "95" },
    { phone: "99123456", network: "QCell", prefix: "99" },
  ];

  for (const test of phoneTests) {
    console.log(`📞 Testing ${test.network} (${test.prefix}): ${test.phone}`);

    const payload = {
      amount: {
        currency: "SLE",
        value: 1000, // 10.00 SLE
      },
      destination: {
        providerCode: "m17", // Use the working provider
        accountId: test.phone,
      },
      metadata: {
        test: "prefix-check",
        network: test.network,
        prefix: test.prefix,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const response = await fetch("https://api.monime.io/payouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MONIME_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `prefix-test-${test.prefix}-${Date.now()}`,
          "Monime-Space-Id": process.env.MONIME_SPACE_ID,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(
          `  ✅ SUCCESS - ${test.network} prefix ${test.prefix} works`
        );
        console.log(`     Payout ID: ${result.result?.id}`);
      } else {
        const errorMsg = result.error?.message || "Unknown error";
        console.log(`  ❌ FAILED - ${test.network} prefix ${test.prefix}`);
        console.log(`     Error: ${errorMsg}`);
      }
    } catch (error) {
      console.log(
        `  🚨 REQUEST FAILED - ${test.network} prefix ${test.prefix}`
      );
      console.log(`     Error: ${error.message}`);
    }

    // Small delay
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("\n📋 SUMMARY:");
  console.log("- m17 is the only valid provider code for Sierra Leone");
  console.log(
    "- It appears to be a universal provider that routes to different networks"
  );
  console.log("- Check above to see which phone prefixes are supported");
}

testPhonePrefixes().catch(console.error);
