"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const transferId = searchParams.get("transfer_id");
  const [transfer, setTransfer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [transferNumber, setTransferNumber] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!transferId) return;
    supabase
      .from("transfers")
      .select("*")
      .eq("id", transferId)
      .single()
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setTransfer(data);
        setLoading(false);
      });
  }, [transferId]);

  // Simulate payment success and generate transfer number
  const handlePayment = async () => {
    // Generate a unique transfer number (e.g., random 10-digit alphanumeric)
    const uniqueNumber =
      "TRF-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setTransferNumber(uniqueNumber);
    setPaymentSuccess(true);
    // Update transfer in Supabase
    await supabase
      .from("transfers")
      .update({
        status: "in_progress",
        transfer_number: uniqueNumber,
      })
      .eq("id", transferId);
  };

  const handleComplete = async () => {
    await supabase
      .from("transfers")
      .update({ status: "completed" })
      .eq("id", transferId);
    setCompleted(true);
  };

  // Payment method UI rendering
  function PaymentMethodUI({ transfer }: { transfer: any }) {
    if (!transfer) return null;
    switch (transfer.payment_method) {
      case "card":
        return (
          <div className="mb-4">
            <div className="mb-2 font-semibold">Pay by Card</div>
            <div className="mb-2 text-sm text-gray-600">
              (Card payment UI would go here)
            </div>
          </div>
        );
      case "mobile":
        return (
          <div className="mb-4">
            <div className="mb-2 font-semibold">Pay by Mobile Money</div>
            <div className="mb-2 text-sm text-gray-600">
              (Mobile money UI would go here)
            </div>
          </div>
        );
      case "bank":
        return (
          <div className="mb-4">
            <div className="mb-2 font-semibold">Pay by Bank Transfer</div>
            <div className="mb-2 text-sm text-gray-600">
              (Bank transfer UI would go here)
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!transfer)
    return <div className="p-8 text-center">Transfer not found.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 py-10 px-2">
      <div className="bg-white/90 border border-blue-100 rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-6 text-blue-900">Payment</h1>
        <div className="mb-6">
          <div className="mb-2">
            Amount:{" "}
            <span className="font-semibold">£{transfer.amount_gbp}</span>
          </div>
          <div className="mb-2">
            Recipient:{" "}
            <span className="font-semibold">{transfer.recipient_id}</span>
          </div>
          <div className="mb-2">
            Fee: <span className="font-semibold">£{transfer.fee_gbp}</span>
          </div>
          <div className="mb-2">
            Total: <span className="font-semibold">£{transfer.total_gbp}</span>
          </div>
          <div className="mb-2">
            Status:{" "}
            <span className="font-semibold capitalize">
              {paymentSuccess ? "In Progress" : transfer.status}
            </span>
          </div>
          <PaymentMethodUI transfer={transfer} />
          {paymentSuccess && transferNumber && (
            <div className="mt-4 text-green-700">
              <div className="font-bold">Transfer Number: {transferNumber}</div>
              <div className="text-sm mt-2">
                Your transfer is in progress and will be updated when it reaches
                the recipient's phone number.
              </div>
              {!completed && (
                <Button
                  className="w-full py-3 text-lg rounded-xl font-semibold mt-4"
                  onClick={handleComplete}
                >
                  Mark as Complete
                </Button>
              )}
              {completed && (
                <div className="mt-4 text-green-700 font-bold">
                  Transfer marked as complete!
                </div>
              )}
            </div>
          )}
        </div>
        {!paymentSuccess && (
          <Button
            className="w-full py-3 text-lg rounded-xl font-semibold"
            onClick={handlePayment}
          >
            Pay Now
          </Button>
        )}
      </div>
    </div>
  );
}
