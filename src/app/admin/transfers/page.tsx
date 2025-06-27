"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { TransferStatusBadge } from "@/components/transfer-status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Transfer {
  id: string;
  user_id: string;
  recipient_name: string;
  recipient_phone: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  payment_intent_id: string;
  profiles: {
    email: string;
    full_name: string;
  };
}

export default function AdminTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [monimeStatus, setMonimeStatus] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    // Fetch initial transfers with user profile info
    async function fetchTransfers() {
      const { data, error } = await supabase
        .from("transfers")
        .select("*, profiles(email, full_name)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching transfers:", error);
        return;
      }

      if (isMounted) {
        setTransfers(data);
      }
    }

    async function setupSubscription() {
      await fetchTransfers();

      if (!isMounted) return;

      // Create a unique channel name to avoid conflicts
      const channelName = `admin-transfers-${Math.random()
        .toString(36)
        .substring(7)}`;

      subscription = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transfers",
          },
          async (payload: any) => {
            if (!isMounted) return;

            // Fetch the full transfer record with profile info
            const { data, error } = await supabase
              .from("transfers")
              .select("*, profiles(email, full_name)")
              .eq("id", payload.new.id)
              .single();

            if (error) {
              console.error("Error fetching updated transfer:", error);
              return;
            }

            if (payload.eventType === "INSERT") {
              setTransfers((current) => [data, ...current]);
              toast({
                title: "🆕 New Transfer Created",
                description: `${data.amount} ${data.currency} to ${data.recipient_name} from ${data.profiles.full_name}`,
                duration: 5000,
              });
            } else if (payload.eventType === "UPDATE") {
              setTransfers((current) =>
                current.map((transfer) =>
                  transfer.id === data.id ? data : transfer
                )
              );

              // Show status change notifications
              if (data.status === "failed") {
                toast({
                  title: "⚠️ Transfer Failed",
                  description: `Transfer to ${data.recipient_name} failed - check Monime account funds`,
                  variant: "destructive",
                  duration: 8000,
                });
              } else if (data.status === "completed") {
                toast({
                  title: "✅ Transfer Completed",
                  description: `Transfer to ${data.recipient_name} completed successfully`,
                  duration: 5000,
                });
              }
            }
          }
        )
        .subscribe();
    }

    setupSubscription();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [toast]);

  async function processTransfer(id: string) {
    const { error } = await supabase
      .from("transfers")
      .update({ status: "processing" })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to process transfer",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Transfer marked as processing",
    });
  }

  async function checkMonimeStatus() {
    setMonimeStatus("Checking...");
    try {
      const response = await fetch("/api/test-monime-connection", {
        method: "POST",
      });
      const result = await response.json();
      setMonimeStatus(
        result.success
          ? `✅ Connected - Balance available`
          : `❌ ${result.error}`
      );
    } catch (error) {
      setMonimeStatus("❌ Connection failed");
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Transfers</h1>
        <div className="flex items-center space-x-4">
          <Button onClick={checkMonimeStatus} variant="outline">
            Check Monime Status
          </Button>
          {monimeStatus && (
            <div className="text-sm bg-gray-100 px-3 py-2 rounded">
              {monimeStatus}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">
          ⚠️ Common Issues:
        </h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>
            • <strong>Transfers not appearing in Monime:</strong> Check if
            Monime account has sufficient funds
          </li>
          <li>
            • <strong>Failed payouts:</strong> Verify recipient phone numbers
            and provider codes
          </li>
          <li>
            • <strong>Metadata errors:</strong> Ensure all metadata values are
            strings, not numbers or booleans
          </li>
        </ul>
      </div>
      <ScrollArea className="h-[700px] w-full rounded-md border">
        <div className="p-4 space-y-4">
          {transfers.map((transfer) => (
            <Card key={transfer.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        To: {transfer.recipient_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        📱 {transfer.recipient_phone}
                      </p>
                      <p className="text-sm text-gray-500">
                        👤 From: {transfer.profiles.full_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        📧 {transfer.profiles.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        🕒 Created:{" "}
                        {formatDistanceToNow(new Date(transfer.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                      <p className="text-sm text-gray-500">
                        💳 Payment ID: {transfer.payment_intent_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        🆔 Transfer ID: {transfer.id}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-xl">
                    {transfer.amount} {transfer.currency}
                  </p>
                  <div className="mt-2">
                    <TransferStatusBadge status={transfer.status} />
                  </div>
                  {transfer.status === "pending" && (
                    <Button
                      className="mt-2"
                      onClick={() => processTransfer(transfer.id)}
                      size="sm"
                    >
                      Process Transfer
                    </Button>
                  )}
                  {transfer.status === "failed" && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      ⚠️ Check Monime funds
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
