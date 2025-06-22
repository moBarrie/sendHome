"use client";

import Link from "next/link";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full border-b bg-background/95 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <Link href="/" className="text-primary hover:underline text-lg">
            Home
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 max-w-3xl space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-2">
            1. Information We Collect
          </h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>Personal information you provide (name, email, phone, etc.)</li>
            <li>Transaction details and payment information</li>
            <li>Usage data and cookies</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">
            2. How We Use Your Information
          </h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>To process your transfers and provide customer support</li>
            <li>To comply with legal and regulatory requirements</li>
            <li>To improve our services and prevent fraud</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">3. Data Security</h2>
          <p className="text-muted-foreground">
            We use industry-standard security measures to protect your data.
            Your information is never sold to third parties.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">4. Your Rights</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>
              You can request access to or deletion of your data at any time.
            </li>
            <li>Contact us for any privacy-related questions or requests.</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">5. Contact</h2>
          <p className="text-muted-foreground">
            For privacy questions, please{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contact us
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
