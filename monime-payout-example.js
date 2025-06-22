// Monime payout example for Node.js
// Replace the placeholders with your actual values

const fetch = require("node-fetch");
const { v4: uuidv4 } = require("uuid");

async function createMonimePayout() {
  // Just create the payout directly, skipping any payment method logic
  const idempotencyKey = uuidv4(); // Unique for each request

  const payload = {
    amount: {
      currency: "SLL", // Sierra Leonean Leone
      value: 1000, // Amount in SLL
    },
    destination: {
      providerCode: "m17", // Example: 'm17' for Orange Money SL (check docs for correct code)
      accountId: "+23278000000", // Recipient phone number in international format
    },
    source: {
      financialAccountId: "spc-d69YHBtP6vRzCRa2WxutC7u8dYg", // Using monimeSpaceId as placeholder
    },
    metadata: {},
  };

  const response = await fetch("https://api.monime.io/payouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
      "Monime-Space-Id": process.env.MONIME_SPACE_ID,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  console.log(result);
}

createMonimePayout();
