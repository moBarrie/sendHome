"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, signOut } from "@/lib/auth";

export default function NavAuthenticated() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then((u) => setUser(u));
  }, []);

  const handleLogout = async () => {
    await signOut();
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
