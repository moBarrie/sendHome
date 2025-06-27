#!/usr/bin/env node

// Test script for XE API integration
// To use this script:
// 1. Set your XE API credentials in .env.local
// 2. Run: node test-xe-api.js

require("dotenv").config({ path: ".env.local" });

async function testXEAPI() {
  console.log("🧪 Testing XE API integration...\n");

  const XE_ACCOUNT_API = process.env.XE_ACCOUNT_API;
  const XE_API_KEY = process.env.XE_API_KEY;

  console.log("Environment variables:");
  console.log("XE_ACCOUNT_API:", XE_ACCOUNT_API ? "✓ Set" : "❌ Not set");
  console.log("XE_API_KEY:", XE_API_KEY ? "✓ Set" : "❌ Not set");
  console.log("");

  if (!XE_ACCOUNT_API || !XE_API_KEY) {
    console.log(
      "⚠️  XE API credentials not configured. The API will use fallback rates."
    );
    console.log("");
    console.log("To configure XE API:");
    console.log("1. Sign up at https://www.xe.com/xecurrencydata/");
    console.log("2. Get your Account ID and API Key");
    console.log("3. Add them to .env.local:");
    console.log("   XE_ACCOUNT_API=your_account_id");
    console.log("   XE_API_KEY=your_api_key");
    console.log("");
  } // Test our API endpoint
  try {
    console.log("🔄 Testing our exchange rate API endpoint...");

    // Use dynamic import for fetch in Node.js
    const fetch = (await import("node-fetch")).default;
    const response = await fetch("http://localhost:9002/api/exchange-rate");
    const data = await response.json();

    console.log("✅ API Response:", JSON.stringify(data, null, 2));
    console.log("");

    if (data.source === "xe_api") {
      console.log("🎉 XE API is working correctly!");
    } else if (data.source === "fallback") {
      console.log(
        "⚠️  Using fallback rate. This is normal if XE API credentials are not configured."
      );
    }
  } catch (error) {
    console.error("❌ API test failed:", error.message);
  }
}

testXEAPI().catch(console.error);
