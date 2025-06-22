"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function NavAuthenticated() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <nav className="flex items-center space-x-2">
      <Button asChild variant="ghost">
        <Link href="/profile">Profile</Link>
      </Button>
      <Button variant="outline" onClick={handleLogout}>
        Sign Out
      </Button>
    </nav>
  );
}
