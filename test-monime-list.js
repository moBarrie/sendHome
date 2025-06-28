#!/usr/bin/env node

// Test script to verify Monime payout list API
const https = require("https");

const MONIME_API_KEY = process.env.MONIME_API_KEY;
const MONIME_SPACE_ID = process.env.MONIME_SPACE_ID;

if (!MONIME_API_KEY || !MONIME_SPACE_ID) {
  console.error(
    "❌ Missing environment variables. Please set MONIME_API_KEY and MONIME_SPACE_ID"
  );
  process.exit(1);
}

async function testMonimePayoutList() {
  console.log("🔍 Testing Monime Payout List API");
  console.log("=".repeat(50));

  const options = {
    hostname: "api.monime.io",
    port: 443,
    path: "/payouts?limit=10&offset=0",
    method: "GET",
    headers: {
      Authorization: `Bearer ${MONIME_API_KEY}`,
      "Content-Type": "application/json",
      "Monime-Space-Id": MONIME_SPACE_ID,
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log("📊 Response status:", res.statusCode);
        console.log("📨 Response headers:", res.headers);

        try {
          const responseJson = JSON.parse(data);
          console.log(
            "📨 Response body:",
            JSON.stringify(responseJson, null, 2)
          );

          if (res.statusCode === 200) {
            console.log("✅ SUCCESS: Payout list API works!");

            if (responseJson.result && responseJson.result.data) {
              console.log(
                `📊 Found ${responseJson.result.data.length} payouts`
              );

              // Show summary of statuses
              const statusCounts = {};
              responseJson.result.data.forEach((payout) => {
                statusCounts[payout.status] =
                  (statusCounts[payout.status] || 0) + 1;
              });

              console.log("📈 Status breakdown:");
              Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`   ${status}: ${count}`);
              });

              // Show sample payout
              if (responseJson.result.data.length > 0) {
                const sample = responseJson.result.data[0];
                console.log("📝 Sample payout:");
                console.log(`   ID: ${sample.id}`);
                console.log(`   Status: ${sample.status}`);
                console.log(
                  `   Amount: ${sample.amount.value} ${sample.amount.currency}`
                );
                console.log(`   Phone: ${sample.destination.accountId}`);
                console.log(`   Created: ${sample.createTime}`);
              }
            }

            resolve(responseJson);
          } else {
            console.log("❌ FAILED: Payout list API returned error");
            resolve(responseJson);
          }
        } catch (error) {
          console.log("❌ Failed to parse response:", data);
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ Request error:", error);
      reject(error);
    });

    console.log("📤 Sending GET request to /payouts...");
    req.end();
  });
}

// Run the test
testMonimePayoutList()
  .then(() => {
    console.log("\n✅ Test completed successfully");
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
