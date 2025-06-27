#!/usr/bin/env node

// Test script to check Monime providers for Sierra Leone
require("dotenv").config({ path: ".env.local" });

async function checkMonimeProviders() {
  console.log("🔍 Checking Monime providers for Sierra Leone...\n");

  try {
    // First, let's try to get available providers
    const response = await fetch("https://api.monime.io/providers", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.MONIME_API_KEY}`,
        "Content-Type": "application/json",
        "Monime-Space-Id": process.env.MONIME_SPACE_ID,
      },
    });

    const result = await response.json();
    console.log("📊 Monime providers response status:", response.status);
    console.log(
      "📨 Monime providers response:",
      JSON.stringify(result, null, 2)
    );

    if (result.data) {
      console.log("\n🇸🇱 Looking for Sierra Leone providers...");
      const sierraLeoneProviders = result.data.filter(
        (provider) =>
          provider.country?.toLowerCase().includes("sierra leone") ||
          provider.countryCode === "SL" ||
          provider.code?.toLowerCase().includes("sl")
      );

      if (sierraLeoneProviders.length > 0) {
        console.log("✅ Found Sierra Leone providers:");
        sierraLeoneProviders.forEach((provider) => {
          console.log(
            `  - Code: ${provider.code}, Name: ${provider.name}, Country: ${provider.country}`
          );
        });
      } else {
        console.log("❌ No Sierra Leone providers found");
        console.log("Available providers:");
        result.data.forEach((provider) => {
          console.log(
            `  - Code: ${provider.code}, Name: ${provider.name}, Country: ${
              provider.country || "N/A"
            }`
          );
        });
      }
    }
  } catch (error) {
    console.error("❌ Failed to fetch providers:", error.message);
  }
}

async function testPhoneNumberFormats() {
  console.log("\n📱 Testing phone number formats for Sierra Leone...\n");

  const testPhones = [
    "+23276123456", // Full international format
    "23276123456", // Without +
    "76123456", // Local format
    "076123456", // Local format with leading 0
  ];

  const testProviders = ["m17", "orange", "africell", "airtel"];

  for (const provider of testProviders) {
    console.log(`\n🔧 Testing provider: ${provider}`);

    for (const phone of testPhones) {
      console.log(`  📞 Testing phone: ${phone}`);

      const payload = {
        amount: {
          currency: "SLE",
          value: 1000, // 10.00 SLE in smallest unit
        },
        destination: {
          providerCode: provider,
          accountId: phone,
        },
        metadata: {
          test: "true", // Metadata values must be strings
          stripePaymentIntentId: "pi_test_validation",
        },
      };

      try {
        const response = await fetch("https://api.monime.io/payouts", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.MONIME_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `test-${provider}-${phone}-${Date.now()}`,
            "Monime-Space-Id": process.env.MONIME_SPACE_ID,
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          console.log(
            `    ✅ SUCCESS - Provider: ${provider}, Phone: ${phone}`
          );
        } else {
          console.log(`    ❌ FAILED - Provider: ${provider}, Phone: ${phone}`);
          console.log(`    Error: ${result.error?.message || "Unknown error"}`);
        }
      } catch (error) {
        console.log(
          `    🚨 REQUEST FAILED - Provider: ${provider}, Phone: ${phone}`
        );
        console.log(`    Error: ${error.message}`);
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

async function main() {
  await checkMonimeProviders();
  await testPhoneNumberFormats();
}

main().catch(console.error);
