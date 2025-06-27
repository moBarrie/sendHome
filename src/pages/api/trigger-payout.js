import Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import {
  validateSierraLeonePhone,
  formatPhoneForMonime,
} from "../../lib/sierra-leone-networks.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export default async function handler(req, res) {
  console.log(
    "🚀 trigger-payout called with:",
    JSON.stringify(req.body, null, 2)
  );

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

  console.log("📞 Recipient phone:", recipientPhone);
  console.log("🏢 Provider code:", providerCode);
  console.log("💰 Amount (raw):", amount);

  // Validate and format phone number for Sierra Leone networks
  let phoneValidation;
  try {
    phoneValidation = validateSierraLeonePhone(recipientPhone);
    if (!phoneValidation.valid) {
      console.error("❌ Invalid phone number:", phoneValidation.error);
      return res.status(400).json({
        error: "Invalid phone number",
        details: phoneValidation.error,
      });
    }

    console.log("📱 Phone validation:", {
      network: phoneValidation.network,
      prefix: phoneValidation.prefix,
      working: phoneValidation.working,
      formatted: phoneValidation.localFormat,
    });

    if (phoneValidation.warning) {
      console.warn("⚠️ Phone warning:", phoneValidation.warning);
    }
  } catch (error) {
    console.error("❌ Phone validation failed:", error.message);
    return res.status(400).json({
      error: "Phone validation failed",
      details: error.message,
    });
  }

  const formattedPhone = phoneValidation.localFormat;

  // Convert amount to integer (smallest currency unit)
  // For SLE, we need to convert to the smallest unit (multiply by 100 for cents equivalent)
  const amountInSmallestUnit = Math.round(parseFloat(amount) * 100);
  console.log("💰 Amount in smallest unit:", amountInSmallestUnit);
  console.log("🔑 Stripe Payment Intent ID:", stripePaymentIntentId);

  // Validate and default the provider code
  // NOTE: For Sierra Leone, only 'm17' is a valid provider code in Monime
  // m17 is a universal provider that routes to all Sierra Leone mobile networks:
  // - Africell (76, 77, 88 prefixes)
  // - Orange (30, 33, 34 prefixes)
  // - Airtel (70, 78, 79 prefixes)
  // - QCell (25, 95, 99 prefixes)
  // The routing is handled automatically based on the phone number prefix
  const validProvider = providerCode === "m17" ? providerCode : "m17";
  if (providerCode !== "m17") {
    console.log(
      `⚠️ Invalid provider code '${providerCode}', defaulting to 'm17' (universal Sierra Leone provider)`
    );
  }

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

  console.log("✅ Stripe payment verification successful");

  // 2. Call Monime payout API
  const payload = {
    amount: {
      currency: "SLE", // Use SLE (new Sierra Leone Leone code) instead of SLL
      value: amountInSmallestUnit, // Use integer value in smallest currency unit
    },
    destination: { providerCode: validProvider, accountId: formattedPhone },
    // Remove source field - Monime will use default financial account
    metadata: { stripePaymentIntentId },
  };

  console.log("🎯 Monime payout payload:", JSON.stringify(payload, null, 2));
  console.log(
    "🔑 Using Monime API Key:",
    process.env.MONIME_API_KEY ? "✅ Present" : "❌ Missing"
  );
  console.log(
    "🌐 Using Monime Space ID:",
    process.env.MONIME_SPACE_ID || "❌ Missing"
  );

  try {
    const response = await fetch("https://api.monime.io/payouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.MONIME_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": uuidv4(),
        "Monime-Space-Id": process.env.MONIME_SPACE_ID,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("📊 Monime payout response status:", response.status);
    console.log("📨 Monime payout response:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("❌ Monime payout failed with status:", response.status);
      console.error("❌ Monime error details:", result);
    } else {
      console.log("✅ Monime payout successful!");
    }

    res.status(response.status).json(result);
  } catch (error) {
    console.error("🚨 Monime API request failed:", error);
    res
      .status(500)
      .json({ error: "Failed to call Monime API", details: error.message });
  }
}
