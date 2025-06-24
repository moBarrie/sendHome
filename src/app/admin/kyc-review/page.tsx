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
      // Query the view that includes user email
      const { data, error } = await supabase
        .from("kyc_profiles_with_email")
        .select(
          "id, kyc_status, kyc_document_url, kyc_full_name, kyc_address, kyc_dob, kyc_id_type, kyc_id_number, kyc_id_expiry, kyc_id_image_url, user_email"
        )
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
    <div className="w-full max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Pending KYC Approvals
      </h1>
      {profiles.length === 0 ? (
        <div className="text-center">No pending KYC requests.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="border rounded-lg p-6 flex flex-col gap-4 bg-white shadow-sm"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                <div>
                  <b>User ID:</b> {profile.id}
                </div>
                <div>
                  <b>Email:</b> {profile.user_email || "-"}
                </div>
                <div>
                  <b>Status:</b> {profile.kyc_status}
                </div>
                {profile.kyc_full_name && (
                  <div>
                    <b>Full Name:</b> {profile.kyc_full_name}
                  </div>
                )}
                {profile.kyc_address && (
                  <div className="sm:col-span-2">
                    <b>Address:</b> {profile.kyc_address}
                  </div>
                )}
                {profile.kyc_dob && (
                  <div>
                    <b>Date of Birth:</b> {profile.kyc_dob}
                  </div>
                )}
                {profile.kyc_id_type && (
                  <div>
                    <b>ID Type:</b> {profile.kyc_id_type}
                  </div>
                )}
                {profile.kyc_id_number && (
                  <div>
                    <b>ID Number:</b> {profile.kyc_id_number}
                  </div>
                )}
                {profile.kyc_id_expiry && (
                  <div>
                    <b>ID Expiry:</b> {profile.kyc_id_expiry}
                  </div>
                )}
                {profile.kyc_document_url && (
                  <div className="sm:col-span-2">
                    <a
                      href={profile.kyc_document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      View Document
                    </a>
                  </div>
                )}
                {profile.kyc_id_image_url && (
                  <div className="sm:col-span-2">
                    <b>ID Image:</b>
                    <br />
                    <img
                      src={profile.kyc_id_image_url}
                      alt="ID Document"
                      className="mt-2 rounded border border-gray-300 max-w-full max-h-60"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-3 mt-4 justify-end">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
