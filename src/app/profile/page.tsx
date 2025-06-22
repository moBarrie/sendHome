"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    address: "",
    city: "",
    country: "",
    postal_code: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Fetch extra profile details from Supabase
        const { data } = await supabase
          .from("profiles")
          .select("address, city, country, postal_code")
          .eq("id", u.uid)
          .single();
        if (data) setProfile(data);
        setLoading(false);
      } else router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile((p: any) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    // Upsert profile details in Supabase
    const { error } = await supabase.from("profiles").upsert({
      id: user.uid,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      postal_code: profile.postal_code,
    });
    if (error) setError(error.message);
    else setSuccess(true);
    setSaving(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user || loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 flex flex-col items-center justify-center py-10 px-2">
      <div className="bg-white/90 border border-blue-100 rounded-3xl shadow-2xl p-10 max-w-lg w-full text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-blue-200 flex items-center justify-center text-4xl font-bold text-blue-900 mb-2">
            {user.displayName ? user.displayName[0] : user.email[0]}
          </div>
          <h1 className="text-2xl font-extrabold mb-1 text-blue-900">
            {user.displayName || "-"}
          </h1>
          <div className="text-gray-500 text-sm">{user.email}</div>
        </div>
        <form className="space-y-4 text-left" onSubmit={handleSave}>
          <div>
            <label className="block font-semibold mb-1 text-blue-900">
              Phone
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-blue-100 text-blue-900 rounded-l-lg border border-blue-200 border-r-0 text-base select-none">
                +44
              </span>
              <input
                type="text"
                value={
                  user.phoneNumber ? user.phoneNumber.replace(/^\+?44/, "") : ""
                }
                disabled
                className="border border-blue-200 rounded-r-lg px-3 py-2 bg-gray-100 w-full"
                placeholder="Phone number"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-blue-900">
              Address
            </label>
            <input
              name="address"
              value={profile.address}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Street address"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-blue-900">
                City
              </label>
              <input
                name="city"
                value={profile.city}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="City"
              />
            </div>
            <div className="flex-1">
              <label className="block font-semibold mb-1 text-blue-900">
                Country
              </label>
              <input
                name="country"
                value={profile.country}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Country"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-blue-900">
              Postal Code
            </label>
            <input
              name="postal_code"
              value={profile.postal_code}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Postal Code"
            />
          </div>
          {error && <div className="text-red-500 text-center">{error}</div>}
          {success && (
            <div className="text-green-600 text-center">Profile updated!</div>
          )}
          <Button
            type="submit"
            className="w-full py-3 text-lg rounded-xl font-semibold"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full mt-6 py-3 text-lg rounded-xl font-semibold"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
