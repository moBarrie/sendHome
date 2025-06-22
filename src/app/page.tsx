'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowRight, Info } from 'lucide-react';

export default function Home() {
  const [sendAmount, setSendAmount] = useState('100.00');
  const [phoneNumber, setPhoneNumber] = useState('');

  const EXCHANGE_RATE = 30000; // 1 GBP to SLL
  const FEE = 2.50; // GBP

  const sendAmountNum = parseFloat(sendAmount) || 0;
  
  const recipientGets = useMemo(() => {
    if (sendAmountNum <= FEE) {
      return 0;
    }
    return (sendAmountNum - FEE) * EXCHANGE_RATE;
  }, [sendAmountNum]);

  const handleSendAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
      setSendAmount(value);
    }
  };

  const handleSendMoney = () => {
    // Handle the send money logic
    console.log(`Sending ${sendAmount} GBP to ${phoneNumber}`);
    alert(`Sending ${recipientGets.toLocaleString('en-US')} SLL to ${phoneNumber}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 border-b">
        <h1 className="text-2xl font-bold text-primary">SwiftSend</h1>
      </header>
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Send money to Sierra Leone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="send-amount">You send</Label>
                <div className="flex items-center">
                  <Input
                    id="send-amount"
                    type="text"
                    value={sendAmount}
                    onChange={handleSendAmountChange}
                    className="text-lg font-semibold"
                  />
                  <div className="flex items-center space-x-2 bg-secondary text-secondary-foreground rounded-r-md px-3 border border-l-0 h-10">
                    <span className="text-2xl">🇬🇧</span>
                    <span>GBP</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                <div className="flex flex-col items-center">
                  <span className="font-semibold">{FEE.toFixed(2)} GBP</span>
                  <span>Fee</span>
                </div>
                <ArrowRight className="w-4 h-4" />
                <div className="flex flex-col items-center">
                  <span className="font-semibold">{EXCHANGE_RATE.toLocaleString('en-US')}</span>
                  <span>Rate</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recipient gets</Label>
                <div className="flex items-center">
                  <div className="flex-grow p-2 text-lg font-semibold bg-secondary rounded-l-md border border-r-0 h-10 flex items-center">
                    {recipientGets.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                   <div className="flex items-center space-x-2 bg-secondary text-secondary-foreground rounded-r-md px-3 border border-l-0 h-10">
                    <span className="text-2xl">🇸🇱</span>
                    <span>SLL</span>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="phone-number">Recipient's phone number</Label>
              <Input
                id="phone-number"
                type="tel"
                placeholder="+232 12 345 678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3"/>
                Money will be sent to their mobile money account.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full text-lg py-6" onClick={handleSendMoney} disabled={sendAmountNum <= FEE || !phoneNumber}>
              Send Money
            </Button>
          </CardFooter>
        </Card>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground">
        © {new Date().getFullYear()} SwiftSend. All rights reserved.
      </footer>
    </div>
  );
}
