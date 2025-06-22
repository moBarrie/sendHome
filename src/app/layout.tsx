import type { Metadata } from "next";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "SendHome - Money Transfer",
  description: "Send money to Sierra Leone from the UK, fast and securely.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center">
              <Link href="/" className="mr-6 flex items-center space-x-2">
                <span className="font-bold text-xl">SendHome</span>
              </Link>
              <div className="flex flex-1 items-center justify-end space-x-4">
                <nav className="flex items-center space-x-2">
                  <Button asChild variant="ghost">
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </nav>
              </div>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t">
            <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                © {new Date().getFullYear()} SendHome. All rights reserved.
              </p>
              <nav className="flex items-center gap-4 md:gap-6">
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">About</Link>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms</Link>
                <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy</Link>
              </nav>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
