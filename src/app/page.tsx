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
      <section className="py-10 md:py-16 bg-secondary">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Hero Text */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
              Send Money Home, Instantly
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto md:mx-0 mb-4">
              The fast, secure, and low-cost way to send money from the UK to
              any mobile money account in Sierra Leone.
            </p>
            <Button asChild size="lg">
              <Link href="#send-money">Send Money Now</Link>
            </Button>
          </div>
          {/* Currency Convert Form / Transfer Card */}
          <div className="flex-1 flex justify-center w-full md:w-auto">
            <MoneyTransferCard />
          </div>
        </div>
      </section>

      {/* Trust Banner */}
      <div className="w-full bg-green-50 border-b border-green-200 py-2 flex items-center justify-center text-green-800 text-sm font-medium">
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

      {/* Features Section */}
      <section className="py-8 md:py-12 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Why Choose SendHome?
            </h2>
            <p className="text-muted-foreground mt-1">
              Your trusted partner for international money transfers.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <FastForward className="w-12 h-12 text-primary mb-2" />
              <h3 className="text-xl font-semibold mb-1">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Transfers are typically completed within minutes. Your loved
                ones get the money when they need it.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <Lock className="w-12 h-12 text-primary mb-2" />
              <h3 className="text-xl font-semibold mb-1">
                Bank-Level Security
              </h3>
              <p className="text-muted-foreground">
                We use industry-standard security measures to protect your money
                and your data.
              </p>
              {/* Security Badges */}
              <div className="flex gap-2 mt-2">
                <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium border border-green-200">
                  FCA Regulated
                </span>
                <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium border border-blue-200">
                  SSL Encrypted
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center text-center p-4 border rounded-lg">
              <BadgePercent className="w-12 h-12 text-primary mb-2" />
              <h3 className="text-xl font-semibold mb-1">
                Great Rates, Low Fees
              </h3>
              <p className="text-muted-foreground">
                We offer competitive exchange rates and transparent fees so you
                send more and spend less.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-8 md:py-12 bg-secondary">
        <div className="container mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              How It Works in 3 Easy Steps
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-14 h-14 mx-auto mb-2 text-2xl font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold mb-1">Enter Amount</h3>
              <p className="text-muted-foreground">
                Tell us how much you want to send.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-14 h-14 mx-auto mb-2 text-2xl font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold mb-1">Add Recipient</h3>
              <p className="text-muted-foreground">
                Enter their full name and mobile money number.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-14 h-14 mx-auto mb-2 text-2xl font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold mb-1">Confirm & Send</h3>
              <p className="text-muted-foreground">
                Review your transfer and send your money securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-8 md:py-12 bg-white border-t">
        <div className="container mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              What Our Customers Say
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 border rounded-lg p-6 flex flex-col items-center">
              <img
                src="https://randomuser.me/api/portraits/men/32.jpg"
                alt="Customer"
                className="w-14 h-14 rounded-full mb-2"
              />
              <p className="text-gray-700 italic mb-2">
                “SendHome made it so easy to support my family back home. Fast
                and reliable!”
              </p>
              <span className="text-sm font-semibold text-gray-900">
                Mohamed K.
              </span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-6 flex flex-col items-center">
              <img
                src="https://randomuser.me/api/portraits/women/44.jpg"
                alt="Customer"
                className="w-14 h-14 rounded-full mb-2"
              />
              <p className="text-gray-700 italic mb-2">
                “I love the transparency and the great rates. Highly
                recommended!”
              </p>
              <span className="text-sm font-semibold text-gray-900">
                Fatmata S.
              </span>
            </div>
            <div className="bg-gray-50 border rounded-lg p-6 flex flex-col items-center">
              <img
                src="https://randomuser.me/api/portraits/men/65.jpg"
                alt="Customer"
                className="w-14 h-14 rounded-full mb-2"
              />
              <p className="text-gray-700 italic mb-2">
                “The support team is always there to help. I feel safe using
                SendHome.”
              </p>
              <span className="text-sm font-semibold text-gray-900">
                Alhaji B.
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
