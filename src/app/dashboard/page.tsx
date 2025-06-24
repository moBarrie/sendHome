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
      // 3. Trigger payout
      const payoutRes = await fetch("/api/trigger-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripePaymentIntentId: result.paymentIntent.id,
          transferId,
          recipientPhone: pendingTransfer.recipient_phone,
          amount: pendingTransfer.amount_sll,
          providerCode: "m17", // or your logic
          financialAccountId:
            process.env.NEXT_PUBLIC_MONIME_FINANCIAL_ACCOUNT_ID,
          monimeSpaceId: process.env.NEXT_PUBLIC_MONIME_SPACE_ID,
        }),
      });
      if (!payoutRes.ok) {
        setError("Payment succeeded but payout failed.");
        setProcessing(false);
        return;
      }
      onSuccess();
    } else {
      setError("Payment not successful.");
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CardElement
        options={{ hidePostalCode: true }}
        className="p-2 border rounded"
      />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <Button type="submit" className="w-full" disabled={processing}>
        {processing ? "Processing..." : `Pay £${amount.toFixed(2)}`}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={onCancel}
        disabled={processing}
      >
        Cancel
      </Button>
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
  const gbpToSll = 28000; // Static fallback rate
  const rateLoading = false;
  const rateError = null;

  // Use a fixed 5% fee for all payment methods
  const FEE_PERCENT = 0.05;
  const amountNum = parseFloat(transferAmount) || 0;
  const fee = amountNum * FEE_PERCENT;
  const total = amountNum + fee;
  const sllAmount = gbpToSll ? amountNum * gbpToSll : 0;

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
      gbp_to_sll_rate: gbpToSll,
      payment_method: paymentMethod,
      fee_gbp: fee,
      total_gbp: total,
      recipient_id: selectedRecipient,
      recipient_phone:
        recipients.find((r) => r.id === selectedRecipient)?.phone || "",
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setPaymentProcessing(true);
    setPaymentError(null);
    // 1. Create the transfer in Supabase
    const transferData = {
      user_id: user.id,
      recipient_id: pendingTransfer.recipient_id,
      amount_gbp: pendingTransfer.amount_gbp,
      amount_sll: pendingTransfer.amount_sll,
      gbp_to_sll_rate: pendingTransfer.gbp_to_sll_rate,
      payment_method: pendingTransfer.payment_method,
      fee_gbp: pendingTransfer.fee_gbp,
      total_gbp: pendingTransfer.total_gbp,
      status: "in_progress",
    };
    const { data, error } = await supabase
      .from("transfers")
      .insert([transferData])
      .select();

    if (error) {
      setPaymentProcessing(false);
      setPaymentError(error.message);
      return;
    }

    // 2. Get recipient details (phone, etc.)
    const recipient = recipients.find(
      (r) => r.id === pendingTransfer.recipient_id
    );

    // 3. Call your backend payout API
    const payoutRes = await fetch("/api/create-payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: recipient.phone, // must be in +232XXXXXXXX format
        amount: pendingTransfer.amount_sll, // payout in SLL
        providerCode: "m17", // TODO: set correct provider code if needed
        financialAccountId: process.env.NEXT_PUBLIC_MONIME_FINANCIAL_ACCOUNT_ID, // set in .env.local
        monimeSpaceId: process.env.NEXT_PUBLIC_MONIME_SPACE_ID, // set in .env.local
      }),
    });
    const payoutResult = await payoutRes.json();
    // Optionally, handle payoutResult (log, update transfer, etc.)

    setPaymentProcessing(false);
    setPaymentSuccess(true);
    setShowPaymentModal(false);
    setShowTransferForm(false);
    setTransferAmount("");
    setSelectedRecipient("");
  };

  // Only render after auth is checked and mounted
  if (!mounted || !authChecked) return null;
  if (!user) return null;
  if (kycStatus !== "approved") {
    return <KycPage />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 py-4 px-1">
      <div className="max-w-6xl w-full text-center">
        <h1 className="text-2xl font-extrabold mb-6 text-blue-900 tracking-tight">
          Welcome, {user.displayName || user.email || "User"}!
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 text-left">
          {/* New Transfer Section */}
          <section className="flex flex-col rounded-xl shadow-md p-4 transition-transform hover:-translate-y-1 hover:shadow-xl backdrop-blur-md bg-transparent">
            <h2 className="text-lg font-bold mb-2 text-blue-900">
              New Transfer
            </h2>
            <p className="text-gray-500 mb-3">
              Send money to Sierra Leone quickly and securely.
            </p>
            <Button
              className="mb-3 w-full text-base py-2 rounded-lg font-semibold shadow-sm"
              onClick={() => setShowTransferForm((v) => !v)}
              variant="default"
              size="lg"
            >
              {showTransferForm ? "Cancel" : "Create Transfer"}
            </Button>
            {showTransferForm && (
              <div className="p-4 rounded-lg border border-blue-100 animate-fadeIn bg-white/10 backdrop-blur-md">
                <form
                  className="flex flex-col gap-3"
                  onSubmit={handleTransferContinue}
                >
                  <label className="font-semibold text-blue-900">
                    Amount (GBP)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="Enter amount in GBP"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="border border-blue-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 transition bg-white/60 backdrop-blur-md"
                  />
                  <div className="text-blue-900 text-center text-sm mb-2">
                    Using fixed rate:{" "}
                    <span className="font-semibold">
                      1 GBP = {gbpToSll.toLocaleString()} SLL
                    </span>
                  </div>
                  <label className="font-semibold text-blue-900 mt-2">
                    Recipient
                  </label>
                  <select
                    value={selectedRecipient}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    className="border border-blue-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 transition bg-white/60 backdrop-blur-md"
                  >
                    <option value="">Select recipient</option>
                    {recipients.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.phone})
                      </option>
                    ))}
                  </select>
                  <label className="font-semibold text-blue-900 mt-2">
                    Payment Method
                  </label>
                  <div className="flex gap-2">
                    {["card"].map((method) => (
                      <button
                        type="button"
                        key={method}
                        className={`px-3 py-2 rounded-lg border font-semibold transition ${
                          paymentMethod === method
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white/60 text-blue-900 border-blue-200"
                        }`}
                        onClick={() =>
                          setPaymentMethod(method as PaymentMethod)
                        }
                        disabled={method !== "card"}
                      >
                        Card
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 bg-blue-50/60 rounded-lg p-3 text-blue-900">
                    <div>
                      Conversion:{" "}
                      <span className="font-semibold">
                        {amountNum && gbpToSll
                          ? `£${amountNum.toFixed(
                              2
                            )} = ${sllAmount.toLocaleString()} SLL`
                          : "-"}
                      </span>
                    </div>
                    <div>
                      Fee:{" "}
                      <span className="font-semibold">
                        {amountNum ? `£${fee.toFixed(2)}` : "-"}
                      </span>{" "}
                      (5%)
                    </div>
                    <div>
                      Total:{" "}
                      <span className="font-bold">
                        {amountNum ? `£${total.toFixed(2)}` : "-"}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full mt-2"
                    disabled={!amountNum || !selectedRecipient || !gbpToSll}
                  >
                    Continue
                  </Button>
                </form>
              </div>
            )}
          </section>
          {/* Recipients Section */}
          <section className="flex flex-col rounded-xl shadow-md p-4 transition-transform hover:-translate-y-1 hover:shadow-xl backdrop-blur-md bg-transparent">
            <h2 className="text-lg font-bold mb-2 text-blue-900">Recipients</h2>
            <p className="text-gray-500 mb-3">Add or manage your recipients.</p>
            <div className="p-4 rounded-lg border border-blue-100 bg-white/10 backdrop-blur-md">
              <form
                onSubmit={handleAddRecipient}
                className="flex flex-col gap-3 mb-4"
              >
                <input
                  type="text"
                  placeholder="Full Name"
                  value={recipientForm.name}
                  onChange={(e) =>
                    setRecipientForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className="border border-blue-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 transition bg-white/60 backdrop-blur-md"
                />
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-blue-100 text-blue-900 rounded-l-lg border border-blue-200 border-r-0 text-base select-none">
                    {SIERRA_LEONE_CODE}
                  </span>
                  <input
                    type="text"
                    placeholder="Phone Number"
                    value={recipientForm.phone}
                    onChange={(e) => {
                      // Only allow digits
                      const val = e.target.value.replace(/\D/g, "");
                      setRecipientForm((f) => ({ ...f, phone: val }));
                    }}
                    required
                    className="border border-blue-200 rounded-r-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 transition bg-white/60 backdrop-blur-md w-full"
                    maxLength={8}
                  />
                </div>
                <select
                  value={recipientForm.country}
                  onChange={(e) =>
                    setRecipientForm((f) => ({ ...f, country: e.target.value }))
                  }
                  required
                  className="border border-blue-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 transition bg-white/60 backdrop-blur-md"
                >
                  <option value="">Select District</option>
                  {SIERRA_LEONE_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  disabled={addingRecipient}
                  className="w-full text-base py-2 rounded-lg font-semibold shadow-sm"
                >
                  {addingRecipient ? "Adding..." : "Add Recipient"}
                </Button>
              </form>
              {error && (
                <div className="text-red-500 mb-2 text-center">{error}</div>
              )}
              {loadingRecipients ? (
                <div className="text-blue-700 text-center">
                  Loading recipients...
                </div>
              ) : recipients.length === 0 ? (
                <div className="text-gray-400 text-center">
                  No recipients yet.
                </div>
              ) : (
                <ul className="space-y-2">
                  {recipients.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-lg p-2 shadow border border-blue-100 bg-white/60 backdrop-blur-md"
                    >
                      <div>
                        <div className="font-semibold text-blue-900">
                          {r.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {r.phone} &middot; {r.country}
                        </div>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded px-3 py-1.5"
                        onClick={() => handleDeleteRecipient(r.id)}
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          {/* Past Transfers Section */}
          <section className="flex flex-col rounded-xl shadow-md p-4 transition-transform hover:-translate-y-1 hover:shadow-xl backdrop-blur-md bg-transparent">
            <h2 className="text-lg font-bold mb-2 text-blue-900">
              Past Transfers
            </h2>
            <p className="text-gray-500 mb-3">View your transfer history.</p>
            <div className="p-4 rounded-lg border border-blue-100 bg-white/10 backdrop-blur-md">
              <div className="text-gray-400 text-center">
                [Transfer history will go here]
              </div>
            </div>
          </section>
        </div>
      </div>
      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogTitle className="sr-only">Card Payment</DialogTitle>
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
            <div className="text-blue-700 mt-2">Processing payment...</div>
          )}
          {paymentError && (
            <div className="text-red-600 mt-2">{paymentError}</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
