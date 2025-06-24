"use client";
import { useState, useEffect } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "../../lib/supabase";
import KycModal from "./KycModal";
import { Button } from "@/components/ui/button";

export default function KycClientLogic({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const user = useUser();
  const [kycRequired, setKycRequired] = useState(false);
  const [kycApproved, setKycApproved] = useState(false);

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

  if (!kycRequired) return null;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded shadow-xl w-full max-w-md text-center">
        <h2 className="text-xl font-bold mb-4">KYC Required</h2>
        <p className="mb-4">
          To send £300 or more, you must complete KYC verification.
        </p>
        <KycModal open={true} onClose={() => {}} />
        <div className="mt-4 text-sm text-gray-600">
          Once your document is uploaded and approved, you can continue your
          transfer.
        </div>
        {kycApproved && (
          <Button className="mt-6" onClick={onContinue}>
            Continue Transfer
          </Button>
        )}
      </div>
    </div>
  );
}
