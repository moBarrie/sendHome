"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@supabase/auth-helpers-react";
import dynamic from "next/dynamic";
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
import { supabase } from "../../lib/supabase";

const KycClientLogic = dynamic(() => import("./KycClientLogic"), {
  ssr: false,
});

export default function SendMoney() {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"card" | "bank" | "">("");
  const [recipient, setRecipient] = useState({
    name: "",
    phone: "",
    country: "Sierra Leone",
  });
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [kycRequired, setKycRequired] = useState(false);
  const [kycApproved, setKycApproved] = useState(false);
  const router = useRouter();

  const user = useUser();
  const amountNum = parseFloat(amount) || 0;

  const fee =
    method === "card"
      ? +(amountNum * 0.03).toFixed(2)
      : method === "bank"
      ? 3.5
      : 0;
  const total = amountNum + fee;

  // Always require KYC before allowing any transfer creation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function checkKyc() {
      if (user?.id) {
        let { data, error } = await supabase
          .from("profiles")
          .select("kyc_status")
          .eq("id", user.id)
          .single();
        if (error && error.code === "PGRST116") {
          await supabase
            .from("profiles")
            .insert([{ id: user.id, kyc_status: "pending" }]);
          data = { kyc_status: "pending" };
        }
        const approved = !!(data && data.kyc_status === "approved");
        setKycApproved(approved);
        setKycRequired(!approved);
        if (!approved) {
          interval = setInterval(async () => {
            const { data } = await supabase
              .from("profiles")
              .select("kyc_status")
              .eq("id", user.id)
              .single();
            const approvedNow = !!(data && data.kyc_status === "approved");
            setKycApproved(approvedNow);
            setKycRequired(!approvedNow);
            if (approvedNow) clearInterval(interval);
          }, 10000);
        }
      } else {
        setKycRequired(false);
        setKycApproved(false);
      }
    }
    checkKyc();
    return () => interval && clearInterval(interval);
  }, [user?.id]);

  // Block all transfer UI if KYC is not approved
  if (kycRequired && !kycApproved) {
    return (
      <KycClientLogic amount={amount} onContinue={() => setKycApproved(true)} />
    );
  }

  // Step 1: Amount & Method
  if (step === 1) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Send Money</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="amount">Amount to Send (GBP)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount in GBP"
                  className="text-lg font-semibold"
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <div className="flex gap-4 mt-2">
                  <Button
                    type="button"
                    variant={method === "card" ? "default" : "outline"}
                    onClick={() => setMethod("card")}
                    className="flex-1"
                  >
                    Card (3% fee)
                  </Button>
                  <Button
                    type="button"
                    variant={method === "bank" ? "default" : "outline"}
                    onClick={() => setMethod("bank")}
                    className="flex-1"
                  >
                    Bank Transfer (£3.50 fee)
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Fee: <span className="font-semibold">£{fee.toFixed(2)}</span>{" "}
                &nbsp;|&nbsp; Total:{" "}
                <span className="font-semibold">£{total.toFixed(2)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full text-lg py-6"
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </CardFooter>
            {error && (
              <div className="text-red-600 text-sm text-center pb-4">
                {error}
              </div>
            )}
          </Card>
        </div>
        <KycClientLogic amount={amount} onContinue={() => setStep(2)} />
      </>
    );
  }

  // Step 2: Recipient Details
  if (step === 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Recipient Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="recipient-name">Recipient Name</Label>
              <Input
                id="recipient-name"
                type="text"
                value={recipient.name}
                onChange={(e) =>
                  setRecipient((r) => ({ ...r, name: e.target.value }))
                }
                placeholder="e.g. Mohamed Sesay"
              />
            </div>
            <div>
              <Label htmlFor="recipient-phone">Recipient Phone</Label>
              <Input
                id="recipient-phone"
                type="tel"
                value={recipient.phone}
                onChange={(e) =>
                  setRecipient((r) => ({ ...r, phone: e.target.value }))
                }
                placeholder="e.g. +232 12 345 678"
              />
            </div>
            <div>
              <Label>Recipient Country</Label>
              <Input
                value={recipient.country}
                readOnly
                className="bg-gray-100"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full text-lg py-6" onClick={() => setStep(3)}>
              Continue
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Step 3: Payment
  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {method === "card" ? (
              <>
                <div className="text-sm text-muted-foreground mb-2">
                  Card payment fee:{" "}
                  <span className="font-semibold">£{fee.toFixed(2)}</span>
                </div>
                <div>
                  <Label>Card Number</Label>
                  <Input
                    name="number"
                    maxLength={19}
                    placeholder="1234 5678 9012 3456"
                    value={card.number}
                    onChange={(e) =>
                      setCard((c) => ({ ...c, number: e.target.value }))
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Expiry</Label>
                    <Input
                      name="expiry"
                      maxLength={5}
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, expiry: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex-1">
                    <Label>CVC</Label>
                    <Input
                      name="cvc"
                      maxLength={4}
                      placeholder="CVC"
                      value={card.cvc}
                      onChange={(e) =>
                        setCard((c) => ({ ...c, cvc: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <div className="mb-2">
                  Bank transfer fee:{" "}
                  <span className="font-semibold">£{fee.toFixed(2)}</span>
                </div>
                <div className="mb-2">
                  Please transfer the total amount to our bank account:
                </div>
                <div className="bg-gray-100 rounded p-4 text-left">
                  <div>
                    <span className="font-semibold">Account Name:</span>{" "}
                    SendHome Ltd
                  </div>
                  <div>
                    <span className="font-semibold">Sort Code:</span> 12-34-56
                  </div>
                  <div>
                    <span className="font-semibold">Account Number:</span>{" "}
                    12345678
                  </div>
                  <div>
                    <span className="font-semibold">Reference:</span>{" "}
                    {recipient.name}
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  We will process your transfer as soon as we receive your
                  payment.
                </div>
              </div>
            )}
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full text-lg py-6"
              onClick={async () => {
                setProcessing(true);
                setTimeout(() => {
                  setProcessing(false);
                  setSuccess(true);
                  setStep(4);
                }, 1500);
              }}
              disabled={processing}
            >
              {method === "card"
                ? processing
                  ? "Processing..."
                  : "Pay Now"
                : processing
                ? "Processing..."
                : "I Have Paid"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Step 4: Success
  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <Card className="w-full max-w-md shadow-2xl text-center">
          <CardHeader>
            <CardTitle className="text-2xl text-green-700">
              Transfer Successful!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl mb-4">🎉</div>
            <div className="mb-2">
              Your transfer of <span className="font-semibold">£{amount}</span>{" "}
              to <span className="font-semibold">{recipient.name}</span> is
              being processed.
            </div>
            <div className="mb-2">Thank you for using SendHome!</div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => router.push("/profile")}>
              Go to Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
}
