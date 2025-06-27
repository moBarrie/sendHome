#!/usr/bin/env node

// Test script to find correct provider codes for Sierra Leone mobile networks
require("dotenv").config({ path: ".env.local" });

async function testSierraLeoneProviders() {
  console.log("🇸🇱 Testing Sierra Leone mobile provider codes...\n");

  // Common Sierra Leone mobile networks and possible codes
  const sierraLeoneProviders = [
    // Known working
    "m17",

    // Africell variations
    "africell",
    "africell-sl",
    "africell_sl",
    "afc",
    "afc-sl",
    "sl-africell",

    // Orange variations
    "orange",
    "orange-sl",
    "orange_sl",
    "org",
    "org-sl",
    "sl-orange",

    // Airtel variations
    "airtel",
    "airtel-sl",
    "airtel_sl",
    "arl",
    "arl-sl",
    "sl-airtel",

    // Sierratel (national telecom)
    "sierratel",
    "sierratel-sl",
    "stel",
    "st",

    // QCell variations
    "qcell",
    "qcell-sl",
    "qc",
    "qc-sl",

    // Comium variations
    "comium",
    "comium-sl",
    "com",
    "com-sl",

    // Generic codes
    "sl1",
    "sl2",
    "sl3",
    "sl4",
    "sierra-leone-1",
    "sierra-leone-2",
    "mtn-sl",
    "vodafone-sl",
  ];

  const testPhone = "76123456"; // Local format

  for (const provider of sierraLeoneProviders) {
    console.log(`🔧 Testing provider: ${provider}`);

    const payload = {
      amount: {
        currency: "SLE",
        value: 1000, // 10.00 SLE
      },
      destination: {
        providerCode: provider,
        accountId: testPhone,
      },
      metadata: {
        test: "provider-discovery",
        provider: provider,
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const response = await fetch("https://api.monime.io/payouts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MONIME_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `test-${provider}-${Date.now()}-${Math.random()}`,
          "Monime-Space-Id": process.env.MONIME_SPACE_ID,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`  ✅ SUCCESS - Provider: ${provider}`);
        console.log(`     Payout ID: ${result.result?.id || "N/A"}`);
        console.log(`     Status: ${result.result?.status || "N/A"}`);
      } else {
        const errorMsg = result.error?.message || "Unknown error";
        if (errorMsg.includes("does not match any financial provider")) {
          console.log(`  ❌ INVALID - Provider: ${provider} (not found)`);
        } else if (errorMsg.includes("invalid provider account")) {
          console.log(
            `  ⚠️  PROVIDER EXISTS but account invalid - Provider: ${provider}`
          );
          console.log(`     Error: ${errorMsg}`);
        } else {
          console.log(`  ❓ OTHER ERROR - Provider: ${provider}`);
          console.log(`     Error: ${errorMsg}`);
        }
      }
    } catch (error) {
      console.log(`  🚨 REQUEST FAILED - Provider: ${provider}`);
      console.log(`     Error: ${error.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  console.log("\n✅ Test completed! Check above for valid provider codes.");
}

testSierraLeoneProviders().catch(console.error);
