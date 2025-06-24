"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface KycStatus {
  kyc_status: "pending" | "approved" | "rejected" | null;
  kyc_submitted_at: string | null;
}

interface KycStatusCheckProps {
  children: React.ReactNode;
  showAlert?: boolean;
}

export function KycStatusCheck({
  children,
  showAlert = true,
}: KycStatusCheckProps) {
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkKycStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("kyc_status, kyc_submitted_at")
        .eq("id", user.id)
        .single();

      setStatus(data);
      setLoading(false);
    }

    checkKycStatus();
  }, []);

  if (loading) return null;

  if (!status?.kyc_status || status.kyc_status === "rejected") {
    return (
      <div className="space-y-4">
        {showAlert && (
          <Alert variant="destructive">
            <AlertTitle>KYC Required</AlertTitle>
            <AlertDescription>
              You need to complete KYC verification before you can make
              transfers.
              {status?.kyc_status === "rejected" &&
                " Your previous submission was rejected. Please submit again."}
            </AlertDescription>
            <Button
              className="mt-2"
              variant="outline"
              onClick={() => (window.location.href = "/kyc")}
            >
              Complete KYC
            </Button>
          </Alert>
        )}
      </div>
    );
  }

  if (status.kyc_status === "pending") {
    return (
      <div className="space-y-4">
        {showAlert && (
          <Alert>
            <AlertTitle className="flex items-center gap-2">
              KYC Verification Pending
              <Badge variant="outline">Pending Review</Badge>
            </AlertTitle>
            <AlertDescription>
              Your KYC verification is being reviewed. This usually takes 1-2
              business days. Submitted on:{" "}
              {new Date(status.kyc_submitted_at!).toLocaleDateString()}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // If KYC is approved, render the children
  return <>{children}</>;
}
