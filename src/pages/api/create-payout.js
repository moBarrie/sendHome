import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, amount, providerCode, financialAccountId, monimeSpaceId } =
    req.body;

  const accessToken = process.env.MONIME_ACCESS_TOKEN; // Store your token in .env.local

  const payload = {
    amount: { value: amount }, // Remove currency field
    destination: { providerCode, accountId: phone },
    source: { financialAccountId },
    metadata: {},
  };

  const response = await fetch("https://api.monime.io/payouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Idempotency-Key": uuidv4(),
      "Monime-Space-Id": process.env.MONIME_SPACE_ID,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  res.status(response.status).json(result);
}
