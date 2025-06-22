"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Profile() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      else router.push("/login");
    });
    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center">
      <div className="bg-white border rounded-lg shadow p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        <div className="mb-2">
          <span className="font-semibold">Name:</span> {user.displayName || "-"}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Email:</span> {user.email}
        </div>
        <div className="mb-2">
          <span className="font-semibold">Phone:</span>{" "}
          {user.phoneNumber || "-"}
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-primary text-primary-foreground font-semibold py-2 rounded hover:bg-primary/90 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
