import { MoneyTransferCard } from '@/components/money-transfer-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FastForward, Lock, BadgePercent } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-secondary">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Send Money Home, Instantly
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            The fast, secure, and low-cost way to send money from the UK to any mobile money account in Sierra Leone.
          </p>
          <Button asChild size="lg">
            <Link href="#send-money">Send Money Now</Link>
          </Button>
        </div>
      </section>

      {/* Transfer Card Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto flex justify-center">
          <MoneyTransferCard />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Why Choose SendHome?</h2>
            <p className="text-muted-foreground mt-2">Your trusted partner for international money transfers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 border rounded-lg">
              <FastForward className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Transfers are typically completed within minutes. Your loved ones get the money when they need it.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 border rounded-lg">
              <Lock className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Bank-Level Security</h3>
              <p className="text-muted-foreground">
                We use industry-standard security measures to protect your money and your data.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 border rounded-lg">
              <BadgePercent className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Great Rates, Low Fees</h3>
              <p className="text-muted-foreground">
                We offer competitive exchange rates and transparent fees so you send more and spend less.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works in 3 Easy Steps</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-16 h-16 mx-auto mb-4 text-2xl font-bold">1</div>
              <h3 className="text-xl font-semibold mb-2">Enter Amount</h3>
              <p className="text-muted-foreground">Tell us how much you want to send.</p>
            </div>
            <div>
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-16 h-16 mx-auto mb-4 text-2xl font-bold">2</div>
              <h3 className="text-xl font-semibold mb-2">Add Recipient</h3>
              <p className="text-muted-foreground">Enter their full name and mobile money number.</p>
            </div>
            <div>
              <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-16 h-16 mx-auto mb-4 text-2xl font-bold">3</div>
              <h3 className="text-xl font-semibold mb-2">Confirm & Send</h3>
              <p className="text-muted-foreground">Review your transfer and send your money securely.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
