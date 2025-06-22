"use client";

import { useState } from "react";
import Link from "next/link";
import { signUpWithEmail } from "@/lib/auth";

const steps = ["Email", "Name", "Password", "Done"];

export default function Signup() {
  // Steps: 1=email, 2=name, 3=password, 4=done
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  // Step 3: Create account after all info is collected
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setUploading(true);
    try {
      const { error: signUpError } = await signUpWithEmail(
        form.email,
        form.password
      );
      if (signUpError) throw signUpError;
      setStep(4);
    } catch (err: any) {
      // Show full error details for debugging
      setError(
        err?.message ||
          err?.error_description ||
          JSON.stringify(err) ||
          "Signup failed"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 text-foreground flex flex-col">
      <header className="w-full border-b bg-background/95 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">
            Welcome to SendHome
          </h1>
          <Link href="/login" className="text-primary hover:underline text-lg">
            Already have an account?
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 max-w-md">
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.round(((step - 1) / 3) * 100)}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 text-right">
            Step {step} of 3
          </div>
        </div>
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.email) {
                setError("Email is required");
                return;
              }
              setError("");
              setStep(2);
            }}
            className="bg-white border rounded-lg shadow p-8 space-y-6 animate-fadeIn"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-900">
              Let's get started
            </h2>
            <p className="text-gray-500 mb-4">
              Enter your email address to begin creating your SendHome account.
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
            >
              Continue
            </button>
          </form>
        )}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.name) {
                setError("Name is required");
                return;
              }
              setError("");
              setStep(3);
            }}
            className="bg-white border rounded-lg shadow p-8 space-y-6 animate-fadeIn"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-900">
              What's your name?
            </h2>
            <p className="text-gray-500 mb-4">
              We use your name to personalize your experience.
            </p>
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoFocus
                placeholder="e.g. Mariama Kamara"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
            >
              Continue
            </button>
          </form>
        )}
        {step === 3 && (
          <form
            onSubmit={handleSignup}
            className="bg-white border rounded-lg shadow p-8 space-y-6 animate-fadeIn"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-900">
              Create a password
            </h2>
            <p className="text-gray-500 mb-4">
              Choose a strong password to keep your account secure.
            </p>
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
                autoFocus
                placeholder="At least 8 characters"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
              disabled={uploading}
            >
              {uploading ? "Creating..." : "Create Account"}
            </button>
          </form>
        )}
        {step === 4 && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded text-center animate-fadeIn">
            <span className="text-3xl block mb-2">✅</span>
            <h2 className="text-xl font-semibold mb-2">Account Created!</h2>
            <p className="mb-4">
              Your account is set up. You can now log in and use SendHome.
            </p>
            <Link
              href="/login"
              className="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded hover:bg-blue-700 transition"
            >
              Go to Login
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
