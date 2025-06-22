import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/header";
import FooterYear from "@/components/FooterYear";
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
          <Header />
          <main className="flex-1 mt-0">{children}</main>
          <footer className="border-t">
            <div className="container flex flex-col md:flex-row items-center justify-around gap-4 py-10 md:h-24 md:py-0">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                © <FooterYear /> SendHome. All rights reserved.
              </p>
              <nav className="flex items-center gap-4 md:gap-6">
                <Link
                  href="/about"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Contact
                </Link>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Terms
                </Link>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Privacy
                </Link>
              </nav>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
