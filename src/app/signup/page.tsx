"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
} from "firebase/auth";
import { supabase } from "@/lib/supabase";

const steps = ["Email", "Name", "Password", "Phone", "Recipient", "Done"];

export default function Signup() {
  // Steps: 1=email, 2=name, 3=password, 4=phone, 41=code, 5=recipient, 6=done
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    code: "",
    recipientName: "",
    recipientPhone: "+232",
    recipientCountry: "Sierra Leone",
  });
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [verificationId, setVerificationId] = useState("");
  const recaptchaRef = useRef(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Step 3: Create account after all info is collected
  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setUploading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      await updateProfile(userCred.user, { displayName: form.name });
      setStep(4);
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setUploading(false);
    }
  };

  // Step 4: Phone Verification
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      if (!recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current = new RecaptchaVerifier(
          recaptchaRef.current as HTMLDivElement,
          { size: "invisible" },
          auth
        );
      }
      const appVerifier = recaptchaVerifierRef.current;
      const confirmation = await signInWithPhoneNumber(
        auth,
        form.phone,
        appVerifier
      );
      setVerificationId(confirmation.verificationId);
      setStep(41);
    } catch (err: any) {
      setError(err.message || "Phone verification failed");
    }
  };
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        form.code
      );
      await auth.currentUser.linkWithCredential(credential);
      setStep(5);
    } catch (err) {
      setError(err.message || "Code verification failed");
    }
  };

  // Step 5: Add Recipient
  const handleRecipientSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setUploading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      const { error: supaError } = await supabase.from("recipients").insert({
        user_id: user.uid,
        name: form.recipientName,
        phone: form.recipientPhone,
        country: form.recipientCountry,
      });
      if (supaError) throw supaError;
      setStep(6);
    } catch (err) {
      setError(err.message || "Could not save recipient");
    } finally {
      setUploading(false);
    }
  };

  // Progress bar
  const progress = Math.round((((step === 41 ? 4 : step) - 1) / 5) * 100);

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
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 text-right">
            Step {step === 41 ? 4 : step} of 5
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
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // UK phone validation
              const phone = form.phone.trim();
              if (!phone.startsWith("+44") || phone.length < 10) {
                setError(
                  "Please enter a valid UK phone number starting with +44"
                );
                return;
              }
              setError("");
              handlePhoneSubmit(e);
            }}
            className="bg-white border rounded-lg shadow p-8 space-y-6 animate-fadeIn"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-900">
              Verify your phone
            </h2>
            <p className="text-gray-500 mb-4">
              We'll send you a code to verify your UK phone number for extra
              security. Only UK (+44) numbers are accepted.
            </p>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                UK Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                autoFocus
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="e.g. +44 7123 456789"
              />
            </div>
            <div id="recaptcha-container" ref={recaptchaRef}></div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
              disabled={uploading}
            >
              {uploading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}
        {step === 41 && (
          <form
            onSubmit={handleCodeSubmit}
            className="bg-white border rounded-lg shadow p-8 space-y-6 animate-fadeIn"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-900">
              Enter the code
            </h2>
            <p className="text-gray-500 mb-4">
              Check your SMS messages and enter the code we sent you.
            </p>
            <div>
              <label htmlFor="code" className="block text-sm font-medium mb-1">
                SMS Code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                autoFocus
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({ ...f, code: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                placeholder="6-digit code"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
            >
              Verify & Continue
            </button>
          </form>
        )}
        {step === 5 && (
          <form
            onSubmit={handleRecipientSubmit}
            className="bg-white border rounded-lg shadow p-8 space-y-6 animate-fadeIn"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-900">
              Add your first recipient
            </h2>
            <p className="text-gray-500 mb-4">
              Who are you sending money to in Sierra Leone?
            </p>
            <div>
              <label
                htmlFor="recipientName"
                className="block text-sm font-medium mb-1"
              >
                Recipient Name
              </label>
              <input
                id="recipientName"
                name="recipientName"
                type="text"
                required
                autoFocus
                placeholder="e.g. Mohamed Sesay"
                value={form.recipientName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recipientName: e.target.value }))
                }
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>
            <div>
              <label
                htmlFor="recipientPhone"
                className="block text-sm font-medium mb-1"
              >
                Recipient Phone
              </label>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🇸🇱</span>
                <input
                  id="recipientPhone"
                  name="recipientPhone"
                  type="tel"
                  required
                  placeholder="e.g. +232 12 345 678"
                  value={form.recipientPhone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, recipientPhone: e.target.value }))
                  }
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="recipientCountry"
                className="block text-sm font-medium mb-1"
              >
                Recipient Country
              </label>
              <input
                id="recipientCountry"
                name="recipientCountry"
                type="text"
                required
                value={form.recipientCountry}
                readOnly
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-100"
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
              disabled={uploading}
            >
              {uploading ? "Saving..." : "Finish Setup"}
            </button>
          </form>
        )}
        {step === 6 && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-8 rounded text-center animate-fadeIn">
            <span className="text-3xl block mb-2">✅</span>
            <h2 className="text-xl font-semibold mb-2">Account Created!</h2>
            <p className="mb-4">
              Your account and first recipient are set up. You can now send
              money home with confidence.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-blue-600 text-white font-semibold py-2 px-6 rounded hover:bg-blue-700 transition"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
