import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    recipientPhone,
    amount,
    providerCode,
    financialAccountId,
    monimeSpaceId,
    stripePaymentIntentId,
  } = req.body;

  // 1. Verify Stripe payment intent
  let paymentIntent;
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);
    if (paymentIntent.status !== "succeeded") {
      console.error("Stripe payment not successful", paymentIntent);
      return res.status(400).json({ error: "Payment not successful" });
    }
  } catch (err) {
    console.error("Stripe payment intent error:", err);
    return res.status(400).json({ error: "Invalid payment intent" });
  }

  // 2. Call Monime payout API
  const accessToken = process.env.MONIME_ACCESS_TOKEN;
  const payload = {
    amount: { value: amount }, // Remove currency field
    destination: { providerCode, accountId: recipientPhone },
    source: { financialAccountId },
    metadata: { stripePaymentIntentId },
  };

  console.log("Monime payout payload:", payload);

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
  console.log("Monime payout response:", result);
  res.status(response.status).json(result);
}
