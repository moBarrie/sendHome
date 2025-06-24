"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

// Simple RBAC: Only allow users with admin claim in their JWT
async function isAdmin() {
  const { data } = await supabase.auth.getUser();
  // You should set a custom claim like app_metadata.role === 'admin' in your auth system
  return data.user && data.user.app_metadata?.role === "admin";
}

export default function AdminKycReview() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [notAdmin, setNotAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndFetch() {
      const admin = await isAdmin();
      setAuthChecked(true);
      if (!admin) {
        setNotAdmin(true);
        return;
      }
      setNotAdmin(false);
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, kyc_status, kyc_document_url")
        .eq("kyc_status", "pending");
      if (error) setError(error.message);
      else setProfiles(data || []);
      setLoading(false);
    }
    checkAuthAndFetch();
  }, []);

  async function approveKyc(id: string) {
    await supabase
      .from("profiles")
      .update({ kyc_status: "approved" })
      .eq("id", id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }
  async function rejectKyc(id: string) {
    await supabase
      .from("profiles")
      .update({ kyc_status: "rejected" })
      .eq("id", id);
    setProfiles((prev) => prev.filter((p) => p.id !== id));
  }

  if (!authChecked) return null;
  if (notAdmin)
    return <div className="p-8 text-red-500">Access denied. Admins only.</div>;
  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Pending KYC Approvals</h1>
      {profiles.length === 0 ? (
        <div>No pending KYC requests.</div>
      ) : (
        <ul className="space-y-6">
          {profiles.map((profile) => (
            <li
              key={profile.id}
              className="border rounded p-4 flex flex-col gap-2"
            >
              <div>
                <b>User ID:</b> {profile.id}
              </div>
              <div>
                <b>Email:</b> {profile.email || "-"}
              </div>
              <div>
                <b>Status:</b> {profile.kyc_status}
              </div>
              {profile.kyc_document_url && (
                <a
                  href={profile.kyc_document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  View Document
                </a>
              )}
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => approveKyc(profile.id)}
                  variant="default"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => rejectKyc(profile.id)}
                  variant="destructive"
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
