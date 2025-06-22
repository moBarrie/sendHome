"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Info } from "lucide-react";
import { useRouter } from "next/navigation";

function PaymentForm({
  amount,
  onSuccess,
  onCancel,
}: {
  amount: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCard({ ...card, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      if (card.number && card.expiry && card.cvc) {
        setProcessing(false);
        onSuccess();
      } else {
        setProcessing(false);
        setError("Please fill all card details.");
      }
    }, 1200);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Label>Card Number</Label>
      <Input
        name="number"
        maxLength={19}
        placeholder="1234 5678 9012 3456"
        value={card.number}
        onChange={handleChange}
        required
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <Label>Expiry</Label>
          <Input
            name="expiry"
            maxLength={5}
            placeholder="MM/YY"
            value={card.expiry}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex-1">
          <Label>CVC</Label>
          <Input
            name="cvc"
            maxLength={4}
            placeholder="CVC"
            value={card.cvc}
            onChange={handleChange}
            required
          />
        </div>
      </div>
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

export function MoneyTransferCard() {
  const [sendAmount, setSendAmount] = useState("100.00");
  const [phoneNumber, setPhoneNumber] = useState("");

  const EXCHANGE_RATE = 30000; // 1 GBP to SLL
  const FEE = 2.5; // GBP

  const sendAmountNum = parseFloat(sendAmount) || 0;

  const recipientGets = useMemo(() => {
    if (sendAmountNum <= FEE) {
      return 0;
    }
    return (sendAmountNum - FEE) * EXCHANGE_RATE;
  }, [sendAmountNum]);

  const [showSummary, setShowSummary] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const router = useRouter();

  // Simulate auth check (replace with real auth logic)
  // For demo: check localStorage for 'sendhome_user'
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAuthenticated(!!localStorage.getItem("sendhome_user"));
    }
  }, []);

  const handleSendAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
      setSendAmount(value);
    }
  };

  const handleSendMoney = () => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }
    setShowSummary(true);
  };

  const handleAuth = (type: "login" | "signup") => {
    setShowAuthPrompt(false);
    router.push(type === "login" ? "/login" : "/signup");
  };

  const handleConfirm = () => {
    setShowSummary(false);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setPaymentSuccess(true);
  };

  const handleCancel = () => {
    setShowSummary(false);
    setShowPayment(false);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl" id="send-money">
      <CardHeader>
        <CardTitle className="text-center text-2xl">
          Send money to Sierra Leone
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="send-amount">You send</Label>
            <div className="flex items-center">
              <Input
                id="send-amount"
                type="text"
                value={sendAmount}
                onChange={handleSendAmountChange}
                className="text-lg font-semibold"
              />
              <div className="flex items-center space-x-2 bg-secondary text-secondary-foreground rounded-r-md px-3 border border-l-0 h-10">
                <span className="text-2xl">🇬🇧</span>
                <span>GBP</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="font-semibold">{FEE.toFixed(2)} GBP</span>
              <span>Fee</span>
            </div>
            <ArrowRight className="w-4 h-4" />
            <div className="flex flex-col items-center">
              <span className="font-semibold">
                {EXCHANGE_RATE.toLocaleString("en-US")}
              </span>
              <span>Rate</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Recipient gets</Label>
            <div className="flex items-center">
              <div className="flex-grow p-2 text-lg font-semibold bg-secondary rounded-l-md border border-r-0 h-10 flex items-center">
                {recipientGets.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <div className="flex items-center space-x-2 bg-secondary text-secondary-foreground rounded-r-md px-3 border border-l-0 h-10">
                <span className="text-2xl">🇸🇱</span>
                <span>SLL</span>
              </div>
            </div>
          </div>
        </div>

        <Separator />
      </CardContent>
      <CardFooter>
        <Button
          className="w-full text-lg py-6"
          onClick={handleSendMoney}
          // Allow send button to be available as soon as the page loads
          disabled={false}
        >
          Send Money
        </Button>
      </CardFooter>
      {/* Summary Modal */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-2">Confirm Transfer</h2>
            <div className="mb-2 text-sm">
              You send:{" "}
              <span className="font-semibold">£{sendAmountNum.toFixed(2)}</span>
            </div>
            <div className="mb-2 text-sm">
              Fee: <span className="font-semibold">£{FEE.toFixed(2)}</span>
            </div>
            <div className="mb-2 text-sm">
              Recipient gets:{" "}
              <span className="font-semibold">
                {recipientGets.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                SLL
              </span>
            </div>
            <div className="mb-4 text-sm">
              Recipient phone:{" "}
              <span className="font-semibold">{phoneNumber}</span>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleConfirm}>
                Confirm & Pay
              </Button>
              <Button className="flex-1" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Enter Card Details</h2>
            <PaymentForm
              amount={sendAmountNum}
              onSuccess={handlePaymentSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
      {/* Success Modal */}
      {paymentSuccess && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-2 text-green-700">
              Payment Successful!
            </h2>
            <div className="mb-2 text-sm">
              Your transfer of{" "}
              <span className="font-semibold">£{sendAmountNum.toFixed(2)}</span>{" "}
              to <span className="font-semibold">{phoneNumber}</span> is being
              processed.
            </div>
            <Button
              className="mt-4 w-full"
              onClick={() => setPaymentSuccess(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
      {/* Auth Prompt Modal */}
      {showAuthPrompt && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-xl font-bold mb-2">
              Sign In or Create Account
            </h2>
            <p className="mb-4 text-muted-foreground">
              You need an account to send money.
            </p>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => handleAuth("login")}>
                Sign In
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={() => handleAuth("signup")}
              >
                Create Account
              </Button>
            </div>
            <Button
              className="mt-4 w-full"
              variant="ghost"
              onClick={() => setShowAuthPrompt(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
