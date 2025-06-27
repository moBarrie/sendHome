// Debug script to test Monime API directly
require("dotenv").config({ path: ".env.local" });
const { v4: uuidv4 } = require("uuid");

async function testMonimeAPI() {
  console.log("🧪 Testing Monime API directly...");

  // Check environment variables
  console.log(
    "🔑 API Key:",
    process.env.MONIME_API_KEY ? "Present" : "Missing"
  );
  console.log("🌐 Space ID:", process.env.MONIME_SPACE_ID || "Missing");

  const testPayload = {
    amount: {
      currency: "SLE",
      value: 28000, // Small test amount
    },
    destination: {
      providerCode: "m17",
      accountId: "+23276123456", // Test phone number
    },
    metadata: {
      test: "true",
      timestamp: new Date().toISOString(),
    },
  };

  console.log("📤 Test payload:", JSON.stringify(testPayload, null, 2));

  try {
    const response = await fetch("https://api.monime.io/payouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MONIME_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": uuidv4(),
        "Monime-Space-Id": process.env.MONIME_SPACE_ID,
      },
      body: JSON.stringify(testPayload),
    });

    const result = await response.json();
    console.log("📊 Response status:", response.status);
    console.log("📨 Response body:", JSON.stringify(result, null, 2));
    console.log(
      "📋 Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (response.ok) {
      console.log("✅ Monime API test successful!");
      console.log("🆔 Payout ID:", result.result.id);

      // If successful, let's check the payout status
      if (result.result && result.result.id) {
        console.log("\n🔍 Checking payout status...");
        const statusResponse = await fetch(
          `https://api.monime.io/payouts/${result.result.id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.MONIME_API_KEY}`,
              "Monime-Space-Id": process.env.MONIME_SPACE_ID,
            },
          }
        );

        const statusResult = await statusResponse.json();
        console.log("📋 Payout status:", statusResult.result.status);
        console.log(
          "📊 Full payout details:",
          JSON.stringify(statusResult, null, 2)
        );
      }
    } else {
      console.log("❌ Monime API test failed");
      console.log("🚨 Error details:", result);
    }
  } catch (error) {
    console.error("🚨 Network error:", error.message);
  }
}

testMonimeAPI();
