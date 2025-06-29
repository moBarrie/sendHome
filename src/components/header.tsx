"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import NavAuthenticated from "@/components/nav-authenticated";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    getCurrentUser().then((user) => setIsLoggedIn(!!user));
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getCurrentUser().then((user) => setIsLoggedIn(!!user));
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (isLoggedIn === undefined) {
    // Avoid hydration mismatch: render nothing until auth state is known
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="ml-6 md:ml-12">
          <Logo />
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
