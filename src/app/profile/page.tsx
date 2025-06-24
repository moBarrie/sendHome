"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, signOut as supaSignOut } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    getCurrentUser().then(async (u) => {
      if (u) {
        setUser(u);
        await fetchProfile(u.id);
      } else {
        router.push("/login");
      }
    });
  }, [router]);

  const handleLogout = async () => {
    await supaSignOut();
    router.push("/login");
  };

  const getKycStatusColor = (status?: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getKycStatusMessage = (status?: string) => {
    switch (status) {
      case "approved":
        return "Your KYC has been approved";
      case "rejected":
        return "Your KYC was rejected. Please submit again.";
      case "pending":
        return "Your KYC is under review";
      default:
        return "KYC not submitted";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (!profile?.kyc_full_name) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 py-10 px-4">
        <div className="max-w-md mx-auto">
          <Card className="p-6 text-center">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">
              Complete Your KYC
            </h2>
            <p className="text-gray-600 mb-6">
              Please complete your KYC verification to access all features.
            </p>
            <Button
              onClick={() => router.push("/kyc")}
              className="w-full"
              size="lg"
            >
              Start KYC Verification
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with Avatar and KYC Status */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-200 flex items-center justify-center text-3xl font-bold text-blue-900">
                {profile.kyc_full_name[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">
                  {profile.kyc_full_name}
                </h1>
                <p className="text-gray-500">{user.email}</p>
                {profile.kyc_submitted_at && (
                  <p className="text-sm text-gray-400">
                    Submitted:{" "}
                    {new Date(profile.kyc_submitted_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                className={`px-4 py-2 ${getKycStatusColor(profile.kyc_status)}`}
              >
                {profile.kyc_status?.toUpperCase() || "NOT SUBMITTED"}
              </Badge>
              <p className="text-sm text-gray-500">
                {getKycStatusMessage(profile.kyc_status)}
              </p>
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Full Name</p>
              <p className="text-lg">{profile.kyc_full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Date of Birth</p>
              <p className="text-lg">
                {profile.kyc_dob
                  ? new Date(profile.kyc_dob).toLocaleDateString()
                  : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="text-lg">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <p className="text-lg">{user.phone || "-"}</p>
            </div>
          </div>
        </Card>

        {/* Address Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Address</h2>
          <p className="text-lg whitespace-pre-wrap">{profile.kyc_address}</p>
        </Card>

        {/* ID Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">
            ID Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">ID Type</p>
              <p className="text-lg capitalize">{profile.kyc_id_type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">ID Number</p>
              <p className="text-lg">{profile.kyc_id_number}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">ID Expiry</p>
              <p className="text-lg">
                {profile.kyc_id_expiry
                  ? new Date(profile.kyc_id_expiry).toLocaleDateString()
                  : "-"}
              </p>
            </div>
            {profile.kyc_id_image_url && (
              <div>
                <p className="text-sm text-gray-500 mb-1">ID Document</p>
                <a
                  href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kyc-documents/${profile.kyc_id_image_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View Document
                </a>
              </div>
            )}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleLogout}>
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
