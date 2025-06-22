"use client";

import { auth } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

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

  // Transfer form state
  const [transferAmount, setTransferAmount] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState("");
  type PaymentMethod = "card" | "mobile" | "bank";
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [gbpToSll, setGbpToSll] = useState<number | null>(null);
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState<string | null>(null);

  // Fetch GBP to SLL rate when form is shown
  useEffect(() => {
    if (!showTransferForm) return;
    setRateLoading(true);
    setRateError(null);
    fetch("https://api.exchangerate.host/latest?base=GBP&symbols=SLL")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.rates && data.rates.SLL) {
          setGbpToSll(data.rates.SLL);
        } else {
          setRateError("Could not fetch rate");
        }
        setRateLoading(false);
      })
      .catch(() => {
        setRateError("Could not fetch rate");
        setRateLoading(false);
      });
  }, [showTransferForm]);

  const paymentFees = {
    card: 0.03, // 3%
    mobile: 0.025, // 2.5%
    bank: 0.015, // 1.5%
  };
  const paymentLabels = {
    card: "Card",
    mobile: "Mobile Money",
    bank: "Bank Transfer",
  };
  const amountNum = parseFloat(transferAmount) || 0;
  const fee = amountNum * paymentFees[paymentMethod];
  const total = amountNum + fee;
  const sllAmount = gbpToSll ? amountNum * gbpToSll : 0;

  // Sierra Leone country code
  const SIERRA_LEONE_CODE = "+232";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (mounted && authChecked && !user) {
      window.location.href = "/login";
    }
  }, [mounted, authChecked, user]);

  useEffect(() => {
    if (!user) return;
    setLoadingRecipients(true);
    supabase
      .from("recipients")
      .select("id, name, phone, country, created_at")
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
      .insert([{ name, phone: fullPhone, country, user_id: user.uid }])
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

  // Only render after auth is checked and mounted
  if (!mounted || !authChecked) return null;
  if (!user) return null;

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
                <form className="flex flex-col gap-3">
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
                  {rateLoading ? (
                    <div className="text-blue-700 text-center">
                      Loading rate...
                    </div>
                  ) : rateError ? (
                    <div className="text-red-500 text-center">{rateError}</div>
                  ) : gbpToSll ? (
                    <div className="text-blue-900 text-center text-sm mb-2">
                      Current rate:{" "}
                      <span className="font-semibold">
                        1 GBP = {gbpToSll.toLocaleString()} SLL
                      </span>
                    </div>
                  ) : null}
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
                    {Object.keys(paymentFees).map((method) => (
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
                      >
                        {paymentLabels[method as PaymentMethod]}
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
                      ({(paymentFees[paymentMethod] * 100).toFixed(1)}%)
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
                <input
                  type="text"
                  placeholder="Country"
                  value={recipientForm.country}
                  onChange={(e) =>
                    setRecipientForm((f) => ({ ...f, country: e.target.value }))
                  }
                  required
                  className="border border-blue-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 transition bg-white/60 backdrop-blur-md"
                />
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
    </div>
  );
}
