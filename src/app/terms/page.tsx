"use client";

import Link from "next/link";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full border-b bg-background/95 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">Terms & Conditions</h1>
          <Link href="/" className="text-primary hover:underline text-lg">
            Home
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 max-w-3xl space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-2">1. Introduction</h2>
          <p className="text-muted-foreground">
            By using SendHome, you agree to these terms. Please read them
            carefully before using our service.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">2. Service Use</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>You must be at least 18 years old to use SendHome.</li>
            <li>All information provided must be accurate and up to date.</li>
            <li>
              Transfers are subject to compliance checks and may be delayed or
              declined if required by law.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">3. Fees & Rates</h2>
          <p className="text-muted-foreground">
            All fees and exchange rates are shown before you confirm your
            transfer. Fees are non-refundable once a transfer is completed.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">4. Security</h2>
          <p className="text-muted-foreground">
            We use industry-standard security measures to protect your data and
            funds. Never share your account details with anyone.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">5. Contact</h2>
          <p className="text-muted-foreground">
            For questions about these terms, please{" "}
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
