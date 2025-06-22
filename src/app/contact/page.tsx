"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    reason: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would send the form data to your backend or email service
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full border-b bg-background/95 py-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-3xl font-bold">Contact SendHome</h1>
          <Link
            href="/"
            className="text-primary hover:bg-muted rounded-full p-2 transition"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </Link>
        </div>
      </header>
      <main className="flex-1 container mx-auto py-12 max-w-xl">
        <section className="mb-8 text-center">
          <h2 className="text-xl font-semibold mb-2">How can we help you?</h2>
          <p className="text-muted-foreground">
            For questions about transfers, compliance, or support, please use
            the form below. Our team is here to help you send money home safely
            and easily.
          </p>
        </section>
        {submitted ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded text-center">
            Thank you for reaching out! Our support team will get back to you
            soon.
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border rounded-lg shadow p-8 space-y-6"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-1">
                Phone Number (optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
                placeholder="+44 1234 567890"
              />
            </div>
            <div>
              <label
                htmlFor="reason"
                className="block text-sm font-medium mb-1"
              >
                Reason for Contact
              </label>
              <select
                id="reason"
                name="reason"
                required
                value={form.reason}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
              >
                <option value="">Select a reason</option>
                <option value="transfer">Help with a transfer</option>
                <option value="compliance">Compliance or verification</option>
                <option value="rates">Rates & fees</option>
                <option value="partnership">Partnership inquiry</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium mb-1"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-primary"
                placeholder="How can we help you?"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded hover:bg-primary/90 transition"
            >
              Send Message
            </button>
          </form>
        )}
        <section className="mt-10 text-center text-muted-foreground text-sm">
          <p>
            For urgent support, call us at{" "}
            <a
              href="tel:+442012345678"
              className="text-primary hover:underline"
            >
              +44 20 1234 5678
            </a>
          </p>
          <p>
            Or email{" "}
            <a
              href="mailto:support@sendhome.com"
              className="text-primary hover:underline"
            >
              support@sendhome.com
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
