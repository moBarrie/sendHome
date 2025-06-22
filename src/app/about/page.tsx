"use client";

import Link from "next/link";

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full border-b bg-background/95 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">About SendHome</h1>
          <Link href="/" className="text-primary hover:underline text-lg">Home</Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 max-w-3xl">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
          <p className="text-muted-foreground mb-4">
            SendHome is dedicated to making money transfers to Sierra Leone fast, affordable, and secure. We believe everyone should be able to support their loved ones with confidence and ease.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Why Choose Us?</h2>
          <ul className="list-disc pl-6 text-muted-foreground space-y-2">
            <li>FCA registered and fully compliant with UK regulations</li>
            <li>Bank-level security and encryption for all transactions</li>
            <li>Transparent fees and competitive exchange rates</li>
            <li>24/7 customer support</li>
            <li>Trusted by thousands of users</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Our Story</h2>
          <p className="text-muted-foreground">
            Founded by members of the Sierra Leonean diaspora, SendHome was created to solve the real challenges faced when sending money home. Our team is passionate about connecting families and empowering communities through reliable financial services.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-semibold mb-2">Contact Us</h2>
          <p className="text-muted-foreground">
            Have questions or feedback? <Link href="/contact" className="text-primary hover:underline">Contact our team</Link> — we’re here to help!
          </p>
        </section>
      </main>
    </div>
  );
}
