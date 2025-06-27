#!/usr/bin/env node

// Test script for Monime payout amount conversion
// This simulates the exact format that will be sent to Monime

const amount = 61.02068; // This is what we get from the frontend
const amountInSmallestUnit = Math.round(parseFloat(amount) * 100);

console.log("=== MONIME AMOUNT CONVERSION TEST ===");
console.log("Original amount (SLE):", amount);
console.log("Converted amount (smallest unit):", amountInSmallestUnit);
console.log("Type of converted amount:", typeof amountInSmallestUnit);

// This is the exact payload that will be sent to Monime
const payload = {
  amount: {
    currency: "SLE",
    value: amountInSmallestUnit, // This should be an integer
  },
  destination: {
    providerCode: "m17",
    accountId: "+23276123456",
  },
  metadata: {
    stripePaymentIntentId: "pi_test_123",
  },
};

console.log("\n=== MONIME PAYLOAD ===");
console.log(JSON.stringify(payload, null, 2));

// Test the conversion for different amounts
console.log("\n=== TESTING DIFFERENT AMOUNTS ===");
const testAmounts = [1.5, 10.0, 31.133, 100.99, 1000.001];
testAmounts.forEach((amt) => {
  const converted = Math.round(parseFloat(amt) * 100);
  console.log(`${amt} SLE → ${converted} (smallest unit)`);
});

console.log(
  '\nThe fix should resolve the Monime "cannot unmarshal number into Go struct field" error.'
);
