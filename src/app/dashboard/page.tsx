"use client";

import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useEffect, useState } from "react";
import KycPage from "../kyc/page";
import { KycStatusCheck } from "@/components/kyc-status-check";
import { TransferList } from "@/components/transfer-list";
import UserTransferStatus from "@/components/user-transfer-status";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { validateSierraLeonePhone } from "@/lib/sierra-leone-networks.js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);
console.log(
  "Stripe publishable key:",
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

function StripePaymentForm({
  amount,
  onSuccess,
  onCancel,
  phoneNumber,
  userId,
  pendingTransfer,
}: {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
  phoneNumber: string;
  userId: string;
  pendingTransfer: any;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError("");
    if (!stripe || !elements) {
      setError("Stripe not loaded");
      setProcessing(false);
      return;
    }
    // Get Supabase user session for RLS
    // (No need for Firebase ID token)
    // 1. Create PaymentIntent on backend
    const res = await fetch("/api/create-payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        phoneNumber,
        userId,
        recipientId: pendingTransfer?.recipient_id,
        amountSll: pendingTransfer?.amount_sll,
        gbpToSll: pendingTransfer?.gbp_to_sll_rate,
        paymentMethod: "card", // Always include paymentMethod
      }),
    });
    const { clientSecret, transferId } = await res.json();
    if (!clientSecret) {
      setError("Failed to initiate payment.");
      setProcessing(false);
      return;
    }
    // 2. Confirm card payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement)!,
      },
    });
    if (result.error) {
      setError(result.error.message || "Payment failed.");
      setProcessing(false);
      return;
    }
    if (result.paymentIntent && result.paymentIntent.status === "succeeded") {
      // 3. Trigger payout manually (since webhook might not work in test mode)
      console.log("💳 Payment successful, triggering payout...");
      const payoutRes = await fetch("/api/trigger-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripePaymentIntentId: result.paymentIntent.id,
          recipientPhone: pendingTransfer.recipient_phone,
          amount: pendingTransfer.amount_sll,
          providerCode: "m17",
        }),
      });

      const payoutResult = await payoutRes.json();
      console.log("🎯 Payout response:", payoutResult);

      if (!payoutRes.ok) {
        console.error("❌ Payout failed:", payoutResult);
        setError(
          `Payment succeeded but payout failed: ${
            payoutResult.error || "Unknown error"
          }`
        );
        setProcessing(false);
        return;
      }

      console.log("✅ Payout triggered successfully!");
      onSuccess();
    } else {
      setError("Payment not successful.");
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Card Details
        </label>
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 focus-within:border-blue-500 transition-colors">
          <CardElement
            options={{
              hidePostalCode: true,
              style: {
                base: {
                  fontSize: "16px",
                  color: "#1f2937",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  "::placeholder": {
                    color: "#9ca3af",
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 text-sm flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50"
          onClick={onCancel}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          disabled={processing || !stripe || !elements}
        >
          {processing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            `Pay £${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

export default function Dashboard() {
  // All hooks at the top, before any return or conditional
  const [user, setUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    name: "",
    phone: "",
    country: "",
  });
  const [addingRecipient, setAddingRecipient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneValidation, setPhoneValidation] = useState<any>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<any>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);

  // Transfer form state
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  type PaymentMethod = "card" | "mobile" | "bank";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");

  // Use real-time exchange rate
  const {
    rate: gbpToSll,
    loading: rateLoading,
    error: rateError,
    source: rateSource,
    lastUpdated: rateLastUpdated,
    refresh: refreshRate,
  } = useExchangeRate();

  // Use a 7.5% fee for all payment methods
  const FEE_PERCENT = 0.075;
  const amountNum = parseFloat(transferAmount) || 0;
  const fee = amountNum * FEE_PERCENT;
  const total = amountNum + fee;
  // Convert rate from integer to decimal (rate comes as integer * 1000)
  const actualRate = gbpToSll / 1000;
  const sllAmount = actualRate ? amountNum * actualRate : 0;

  // Sierra Leone country code
  const SIERRA_LEONE_CODE = "+232";

  // List of Sierra Leone districts
  const SIERRA_LEONE_DISTRICTS = [
    "Bo",
    "Bonthe",
    "Bombali",
    "Falaba",
    "Kailahun",
    "Kambia",
    "Karene",
    "Kenema",
    "Koinadugu",
    "Kono",
    "Moyamba",
    "Port Loko",
    "Pujehun",
    "Tonkolili",
    "Western Area Rural",
    "Western Area Urban",
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setAuthChecked(true);
      if (u?.id) {
        supabase
          .from("profiles")
          .select("kyc_status")
          .eq("id", u.id)
          .single()
          .then(({ data }) => setKycStatus(data?.kyc_status || null));
      }
    });
  }, []);

  useEffect(() => {
    if (mounted && authChecked && !user) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, [mounted, authChecked, user]);

  useEffect(() => {
    if (!user) return;
    setLoadingRecipients(true);
    supabase
      .from("recipients")
      .select("id, name, phone, country, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setRecipients(data || []);
        setLoadingRecipients(false);
      });
  }, [user]);

  // Add new recipient
  const handleAddRecipient = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingRecipient(true);
    setError(null);
    const { name, phone, country } = recipientForm;
    // Always prepend +232 to phone
    const fullPhone = SIERRA_LEONE_CODE + phone;
    const { data, error } = await supabase
      .from("recipients")
      .insert([{ user_id: user.id, name, phone: fullPhone, country }])
      .select();
    if (error) setError(error.message);
    else {
      setRecipients((prev) => [data![0], ...prev]);
      setRecipientForm({ name: "", phone: "", country: "" });
    }
    setAddingRecipient(false);
  };

  // Delete recipient
  const handleDeleteRecipient = async (id: string) => {
    if (!confirm("Delete this recipient?")) return;
    const { error } = await supabase.from("recipients").delete().eq("id", id);
    if (error) setError(error.message);
    else setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  // Save transfer only after payment success
  const handleTransferContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingTransfer({
      amount_gbp: amountNum,
      amount_sll: sllAmount,
      gbp_to_sll_rate: actualRate, // Use the actual decimal rate
      payment_method: paymentMethod,
      fee_gbp: fee,
      total_gbp: total,
      recipient_id: selectedRecipient,
      recipient_phone:
        recipients.find((r) => r.id === selectedRecipient)?.phone || "",
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    // Transfer record is already created by the create-payment-intent API
    // No need to create it again here
    console.log("Payment successful! Transfer record already created.");

    setPaymentSuccess(true);
    setShowPaymentModal(false);
    setShowTransferForm(false);
    setTransferAmount("");
    setSelectedRecipient("");
  };

  // Only render after auth is checked and mounted
  if (!mounted || !authChecked) return null;
  if (!user) return null;
  if (!kycStatus) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 py-4 px-1">
        <div className="max-w-6xl w-full text-center">
          <KycPage />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  SendHome
                </h1>
                <p className="text-gray-600 text-sm">
                  Welcome back,{" "}
                  {user.displayName?.split(" ")[0] ||
                    user.email?.split("@")[0] ||
                    "User"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right bg-green-50 px-4 py-2 rounded-xl border border-green-100 relative">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-green-600 font-medium">
                    Live Rate
                  </p>
                  <button
                    onClick={refreshRate}
                    disabled={rateLoading}
                    className="text-xs text-green-600 hover:text-green-700 transition-colors disabled:opacity-50"
                    title="Refresh rate"
                  >
                    <svg
                      className={`w-3 h-3 ${rateLoading ? "animate-spin" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm font-bold text-green-700">
                  1 GBP = {actualRate.toFixed(3)} SLE
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-green-500">
                    {rateSource === "xe_api" ? "XE API" : "Fallback"}
                  </p>
                  {rateError && (
                    <span className="text-xs text-orange-500" title={rateError}>
                      ⚠️
                    </span>
                  )}
                </div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {(
                  user.displayName?.[0] ||
                  user.email?.[0] ||
                  "U"
                ).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions Card */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Send Money
                  </h2>
                  <p className="text-gray-600">
                    Fast transfers to Sierra Leone
                  </p>
                </div>
              </div>
              <KycStatusCheck>
                <Button
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-lg"
                  onClick={() => setShowTransferForm((v) => !v)}
                  size="lg"
                >
                  {showTransferForm ? (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      <span>Cancel</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      <span>New Transfer</span>
                    </div>
                  )}
                </Button>
              </KycStatusCheck>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transfer Form - Full Width When Open */}
          {showTransferForm && (
            <div className="lg:col-span-2">
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/30 p-8">
                <div className="flex items-center mb-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      New Transfer
                    </h3>
                    <p className="text-gray-600">
                      Send money to Sierra Leone instantly
                    </p>
                  </div>
                </div>
                <form className="space-y-6" onSubmit={handleTransferContinue}>
                  {/* Amount Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-inner">
                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                        />
                      </svg>
                      Send Amount
                    </label>
                    <div className="relative mb-4">
                      <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-2xl font-bold text-blue-600">
                        £
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="0.00"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="w-full pl-12 pr-6 py-5 text-3xl font-bold border-2 border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 bg-white shadow-lg transition-all"
                      />
                    </div>

                    {amountNum > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Recipient gets</span>
                          <span className="font-semibold text-green-600 flex items-center">
                            {rateLoading ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-green-600 mr-2"></div>
                                Calculating...
                              </div>
                            ) : (
                              `${sllAmount.toLocaleString()} SLE`
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Transfer fee</span>
                          <span className="font-semibold">
                            £{fee.toFixed(2)}
                          </span>
                        </div>
                        <div className="border-t border-gray-300 pt-2">
                          <div className="flex justify-between text-lg font-bold">
                            <span>Total to pay</span>
                            <span className="text-blue-600">
                              £{total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {rateError && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="text-orange-600 text-sm flex items-center">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        Using fallback exchange rate. {rateError}
                      </div>
                    </div>
                  )}

                  {/* Recipient Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Send to
                    </label>
                    <select
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                    >
                      <option value="">Choose recipient</option>
                      {recipients.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-4 flex items-center">
                      <svg
                        className="w-4 h-4 mr-2 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Payment Method
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                      <div
                        className={`p-5 border-2 rounded-2xl cursor-pointer transition-all duration-200 transform hover:-translate-y-1 ${
                          paymentMethod === "card"
                            ? "border-blue-500 bg-blue-50 shadow-lg ring-4 ring-blue-100"
                            : "border-gray-200 bg-white hover:border-gray-300 shadow-md hover:shadow-lg"
                        }`}
                        onClick={() => setPaymentMethod("card")}
                      >
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                            <svg
                              className="w-6 h-6 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">
                              Debit/Credit Card
                            </h4>
                            <p className="text-sm text-gray-600">
                              Instant transfer • Secure payment
                            </p>
                          </div>
                          {paymentMethod === "card" && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-lg"
                    disabled={
                      !amountNum ||
                      !selectedRecipient ||
                      !actualRate ||
                      rateLoading
                    }
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      <span>Continue to Payment</span>
                    </div>
                  </Button>
                </form>
              </div>
            </div>
          )}

          {/* Recipients Sidebar */}
          <div className={showTransferForm ? "lg:col-span-1" : "lg:col-span-2"}>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Recipients
              </h3>

              {/* Add New Recipient Form */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Add New Recipient
                </h4>
                <form onSubmit={handleAddRecipient} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={recipientForm.name}
                      onChange={(e) =>
                        setRecipientForm((f) => ({
                          ...f,
                          name: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex rounded-lg border border-gray-200 bg-white">
                      <span className="px-4 py-3 bg-gray-100 text-gray-700 border-r border-gray-200 font-medium">
                        {SIERRA_LEONE_CODE}
                      </span>
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={recipientForm.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setRecipientForm((f) => ({ ...f, phone: val }));

                          // Validate phone number as user types
                          if (val.length >= 6) {
                            try {
                              const validation = validateSierraLeonePhone(val);
                              setPhoneValidation(validation);
                            } catch (error) {
                              setPhoneValidation({
                                valid: false,
                                error: "Invalid format",
                              });
                            }
                          } else {
                            setPhoneValidation(null);
                          }
                        }}
                        required
                        className="flex-1 px-4 py-3 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        maxLength={8}
                      />
                    </div>

                    {/* Phone validation feedback */}
                    {phoneValidation && (
                      <div
                        className={`mt-2 text-sm ${
                          phoneValidation.valid
                            ? phoneValidation.working
                              ? "text-green-600"
                              : "text-orange-600"
                            : "text-red-600"
                        }`}
                      >
                        {phoneValidation.valid ? (
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            {phoneValidation.network} ({phoneValidation.prefix})
                            {phoneValidation.warning && (
                              <span className="ml-2 text-orange-600">
                                ⚠️ {phoneValidation.warning}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            {phoneValidation.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <select
                      value={recipientForm.country}
                      onChange={(e) =>
                        setRecipientForm((f) => ({
                          ...f,
                          country: e.target.value,
                        }))
                      }
                      required
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select District</option>
                      {SIERRA_LEONE_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={addingRecipient}
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    {addingRecipient ? "Adding..." : "Add Recipient"}
                  </Button>
                </form>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="text-red-600 text-sm">{error}</div>
                </div>
              )}

              {/* Recipients List */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">
                  Your Recipients
                </h4>
                {loadingRecipients ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : recipients.length === 0 ? (
                  <div className="text-center py-8">
                    <svg
                      className="w-12 h-12 text-gray-400 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <p className="text-gray-500">No recipients yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add your first recipient above
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recipients.map((r) => {
                      // Get network info for display
                      let networkInfo = null;
                      try {
                        networkInfo = validateSierraLeonePhone(r.phone);
                      } catch (e) {
                        // Ignore validation errors for display
                      }

                      return (
                        <div
                          key={r.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                              {r.name[0].toUpperCase()}
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">
                                {r.name}
                              </h5>
                              <div className="flex items-center space-x-2">
                                <p className="text-sm text-gray-600">
                                  {r.phone}
                                </p>
                                {networkInfo?.valid && (
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      networkInfo.working
                                        ? "bg-green-100 text-green-700"
                                        : "bg-orange-100 text-orange-700"
                                    }`}
                                  >
                                    {networkInfo.network}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">
                                {r.country}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRecipient(r.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transfer History - Only show when transfer form is not open */}
          {!showTransferForm && (
            <div className="lg:col-span-1">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
                  </svg>
                  Transfer Status
                </h3>
                <UserTransferStatus userId={user?.id} autoRefresh={true} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900 mb-2">
              Secure Payment
            </DialogTitle>
            <p className="text-gray-600">
              Complete your transfer with card payment
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Amount to pay</span>
              <span className="text-2xl font-bold text-gray-900">
                £{pendingTransfer?.total_gbp?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Recipient will receive{" "}
              {pendingTransfer?.amount_sll?.toLocaleString() || "0"} SLE
            </div>
          </div>

          <Elements stripe={stripePromise}>
            <StripePaymentForm
              amount={pendingTransfer?.total_gbp || 0}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentModal(false)}
              phoneNumber={pendingTransfer?.recipient_phone || ""}
              userId={user?.id}
              pendingTransfer={pendingTransfer}
            />
          </Elements>

          {paymentProcessing && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-700">Processing transfer...</span>
            </div>
          )}
          {paymentError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <div className="text-red-600 text-sm">{paymentError}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Transfer Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              Your money is on its way to the recipient
            </p>
            <Button
              onClick={() => setPaymentSuccess(false)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
