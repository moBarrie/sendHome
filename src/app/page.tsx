"use client";

import { MoneyTransferCard } from "@/components/money-transfer-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FastForward, Lock, BadgePercent } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero + Transfer Card Split Section */}
      <section className="py-12 md:py-20 bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* Hero Text */}
            <div className="flex-1 text-center lg:text-left max-w-2xl lg:max-w-none">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 leading-tight">
                Send Money Home, Instantly
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
                The fast, secure, and low-cost way to send money from the UK to
                any mobile money account in Sierra Leone.
              </p>
              <Button asChild size="lg" className="px-8 py-3">
                <Link href="#send-money">Send Money Now</Link>
              </Button>
            </div>
            {/* Currency Convert Form / Transfer Card */}
            <div className="flex-1 flex justify-center w-full lg:w-auto lg:justify-end">
              <div className="w-full max-w-md">
                <MoneyTransferCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <div className="w-full bg-green-50 border-b border-green-200 py-3">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-center text-green-800 text-sm font-medium">
            <span className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 11V17M12 7H12.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
                />
              </svg>
              FCA Registered • Bank-level Security • Trusted by 10,000+ users
            </span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              Why Choose SendHome?
            </h2>
            <p className="text-muted-foreground text-lg">
              Your trusted partner for international money transfers.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="flex flex-col items-center text-center p-6 border rounded-lg bg-card hover:shadow-md transition-shadow">
              <FastForward className="w-12 h-12 text-primary mb-3" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground leading-relaxed">
                Transfers are typically completed within minutes. Your loved
                ones get the money when they need it.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 border rounded-lg bg-card hover:shadow-md transition-shadow">
              <Lock className="w-12 h-12 text-primary mb-3" />
              <h3 className="text-xl font-semibold mb-2">
                Bank-Level Security
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use industry-standard security measures to protect your money
                and your data.
              </p>
              {/* Security Badges */}
              <div className="flex gap-2 mt-auto">
                <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium border border-green-200">
                  FCA Regulated
                </span>
                <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
                  SSL Encrypted
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center text-center p-6 border rounded-lg bg-card hover:shadow-md transition-shadow">
              <BadgePercent className="w-12 h-12 text-primary mb-3" />
              <h3 className="text-xl font-semibold mb-2">
                Great Rates, Low Fees
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                We offer competitive exchange rates and transparent fees so you
                send more and spend less.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-12 md:py-16 bg-secondary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              How It Works in 3 Easy Steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 text-center">
            <div className="p-6">
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-16 h-16 mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Enter Amount</h3>
              <p className="text-muted-foreground leading-relaxed">
                Tell us how much you want to send.
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-16 h-16 mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Add Recipient</h3>
              <p className="text-muted-foreground leading-relaxed">
                Enter their full name and mobile money number.
              </p>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-16 h-16 mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Confirm & Send</h3>
              <p className="text-muted-foreground leading-relaxed">
                Review your transfer and send your money securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-16 bg-white border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              What Our Customers Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="bg-gray-50 border rounded-lg p-6 flex flex-col items-center hover:shadow-md transition-shadow">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="Customer"
                className="w-16 h-16 rounded-full mb-4"
              />
              <p className="text-gray-700 italic mb-3 leading-relaxed">
                "SendHome made it so easy to support my family back home. Fast
                and reliable!"
              </p>
              <span className="text-sm font-semibold text-gray-900 mt-auto">
                Mohamed K.
              </span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-6 flex flex-col items-center hover:shadow-md transition-shadow">
              <img
                src="https://randomuser.me/api/portraits/women/44.jpg"
                alt="Customer"
                className="w-16 h-16 rounded-full mb-4"
              />
              <p className="text-gray-700 italic mb-3 leading-relaxed">
                "I love the transparency and the great rates. Highly
                recommended!"
              </p>
              <span className="text-sm font-semibold text-gray-900 mt-auto">
                Fatmata S.
              </span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-6 flex flex-col items-center hover:shadow-md transition-shadow">
              <img
                src="https://randomuser.me/api/portraits/men/65.jpg"
                alt="Customer"
                className="w-16 h-16 rounded-full mb-4"
              />
              <p className="text-gray-700 italic mb-3 leading-relaxed">
                "The support team is always there to help. I feel safe using
                SendHome."
              </p>
              <span className="text-sm font-semibold text-gray-900 mt-auto">
                Alhaji B.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
