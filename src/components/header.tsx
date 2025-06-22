"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import NavAuthenticated from "@/components/nav-authenticated";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setIsLoggedIn(!!u));
    return () => unsub();
  }, []);
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href={isLoggedIn ? "/dashboard" : "/"}
          className="flex items-center space-x-2 ml-6 md:ml-12"
        >
          <span className="font-bold text-xl">SendHome</span>
        </Link>
        {isLoggedIn ? (
          <NavAuthenticated />
        ) : (
          <nav className="flex items-center space-x-2">
            <Button asChild variant="ghost">
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
}
