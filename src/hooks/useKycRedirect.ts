import { useEffect } from "react";
import { useRouter } from "next/router";
import { createClient } from "@supabase/supabase-js";

// You may want to use your existing supabase client import instead
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function useKycRedirect(userId: string | null, amount: number) {
  const router = useRouter();

  useEffect(() => {
    if (!userId || amount < 300) return;
    async function checkKyc() {
      const { data, error } = await supabase
        .from("profiles")
        .select("kyc_status")
        .eq("id", userId)
        .single();
      if (error || !data || data.kyc_status !== "approved") {
        router.replace("/kyc");
      }
    }
    checkKyc();
  }, [userId, amount, router]);
}
