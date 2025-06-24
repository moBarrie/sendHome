"use client";
import { useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function EnsureProfileRow() {
  useEffect(() => {
    async function ensureProfile() {
      const user = await getCurrentUser();
      if (user?.id) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        if (error && error.code === "PGRST116") {
          await supabase
            .from("profiles")
            .insert([{ id: user.id, kyc_status: "pending" }]);
        }
      }
    }
    ensureProfile();
  }, []);
  return null;
}
