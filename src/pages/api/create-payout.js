import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    phone,
    amount,
    providerCode,
    financialAccountId,
    monimeSpaceId,
    userId,
  } = req.body;

  console.log("KYC check: userId =", userId, "amount =", amount);

  // Validate required fields
  if (!phone || !amount || !providerCode || !financialAccountId || !userId) {
    console.error("[PAYOUT] Missing required fields:", {
      phone,
      amount,
      providerCode,
      financialAccountId,
      userId,
    });
    return res
      .status(400)
      .json({ error: "Missing required fields for payout." });
  }

  // KYC enforcement: block all payouts unless KYC is approved
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  console.log("Checking KYC for user:", userId);
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("kyc_status")
    .eq("id", userId)
    .single();
  if (profileError) {
    // Handle the case where no profile exists for the user
    if (profileError.code === "PGRST116") {
      console.log(
        "[KYC] No profile found for user, creating new profile with pending KYC:",
        userId
      );
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({ id: userId, kyc_status: "pending" });
      if (insertError) {
        console.error(
          "[KYC] Failed to create new profile for user:",
          insertError
        );
        return res.status(500).json({
          error:
            "Failed to create user profile for KYC check. Please try again or contact support.",
        });
      }
      // Always return after creating a pending profile
      return res.status(403).json({
        error:
          "KYC not completed. Please submit your KYC information to proceed with payouts.",
        kyc_status: "pending",
      });
    }
    // Unexpected error
    console.error(
      "[KYC] Unexpected profile fetch error:",
      profileError,
      "userId:",
      userId
    );
    return res.status(500).json({
      error:
        "Failed to fetch user profile for KYC check. Please try again or contact support.",
    });
  }
  console.log("KYC status for user:", userId, "is", profile?.kyc_status);
  if (!profile || profile.kyc_status !== "approved") {
    console.log(
      "KYC not approved for user:",
      userId,
      "status:",
      profile?.kyc_status
    );
    return res
      .status(403)
      .json({ error: "KYC approval required for all payouts" });
  }

  const accessToken = process.env.MONIME_ACCESS_TOKEN; // Store your token in .env.local
  if (!accessToken) {
    console.error("[PAYOUT] Missing MONIME_ACCESS_TOKEN environment variable.");
    return res
      .status(500)
      .json({ error: "Payout service misconfigured. Please contact support." });
  }

  // Ensure amount is a number
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numericAmount) || numericAmount <= 0) {
    console.error("[PAYOUT] Invalid amount:", amount);
    return res.status(400).json({ error: "Invalid payout amount." });
  }

  const payload = {
    amount: { currency: "SLE", value: numericAmount }, // Use SLE instead of SLL
    destination: { providerCode, accountId: phone },
    source: { financialAccountId },
    metadata: {},
  };

  // Debug: log payload and headers
  console.log("Monime payout payload:", payload);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
    "Idempotency-Key": uuidv4(),
    "Monime-Space-Id": process.env.MONIME_SPACE_ID,
  };
  console.log("Monime payout headers:", headers);

  let response, result;
  try {
    response = await fetch("https://api.monime.io/payouts", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    result = await response.json();
  } catch (err) {
    console.error("[PAYOUT] Monime API request failed:", err);
    return res
      .status(500)
      .json({ error: "Failed to process payout. Please try again later." });
  }

  console.log("Monime payout response:", result);
  res.status(response.status).json(result);
}
