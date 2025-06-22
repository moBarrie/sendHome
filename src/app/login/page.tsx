"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      setSubmitted(true);
      console.log("Login successful, redirecting to /dashboard");
      router.push("/dashboard"); // Redirect to dashboard page after login
    } catch (err) {
      setError("Invalid email or password. Please try again.");
      console.error("Login error:", err);
    }
  };

  // Fallback: If already authenticated, redirect to dashboard
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) {
        console.log("Already authenticated, redirecting to /dashboard");
        router.push("/dashboard");
      }
    });
    return () => unsub();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-foreground flex flex-col">
      <header className="w-full border-b bg-background/95 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">
            Welcome Back
          </h1>
          <Link href="/signup" className="text-primary hover:underline text-lg">
            Create Account
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 max-w-md">
        {submitted ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded text-center animate-fadeIn">
            <span className="text-3xl block mb-2">✅</span>
            Signed in! You can now send money.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border rounded-lg shadow p-8 space-y-6 animate-fadeIn"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-900">
              Sign in to your account
            </h2>
            <p className="text-gray-500 mb-4">
              Enter your email and password to access SendHome.
            </p>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                placeholder="you@email.com"
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
            >
              Sign In
            </button>
            <div className="flex justify-between items-center mt-2 text-sm">
              <Link href="/signup" className="text-blue-600 hover:underline">
                New to SendHome? Create an account
              </Link>
              {/* <Link href="/forgot-password" className="text-blue-600 hover:underline">
                Forgot password?
              </Link> */}
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
