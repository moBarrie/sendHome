#!/usr/bin/env node

// Simple test for Monime payout with known working parameters
require("dotenv").config({ path: ".env.local" });

async function testSimplePayout() {
  console.log("🧪 Testing simple Monime payout...\n");

  const payload = {
    amount: {
      currency: "SLE",
      value: 3113, // 31.13 SLE in smallest unit (cents)
    },
    destination: {
      providerCode: "m17", // Known working provider
      accountId: "+23276123456", // Test phone number
    },
    metadata: {
      test: "true",
      stripePaymentIntentId: "pi_test_simple",
    },
  };

  console.log("📤 Payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch("https://api.monime.io/payouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MONIME_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `test-simple-${Date.now()}`,
        "Monime-Space-Id": process.env.MONIME_SPACE_ID,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    console.log("📊 Response status:", response.status);
    console.log("📨 Response:", JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("\n✅ SUCCESS! Monime payout works with these parameters.");
    } else {
      console.log("\n❌ FAILED. This will help debug the exact issue.");
    }
  } catch (error) {
    console.error("🚨 Request failed:", error.message);
  }
}

testSimplePayout();
