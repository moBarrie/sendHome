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
                title: "New Transfer",
                description: `New transfer of ${data.amount} ${data.currency} to ${data.recipient_name}`,
              });
            } else if (payload.eventType === "UPDATE") {
              setTransfers((current) =>
                current.map((transfer) =>
                  transfer.id === data.id ? data : transfer
                )
              );
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

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Manage Transfers</h1>
      <ScrollArea className="h-[700px] w-full rounded-md border">
        <div className="p-4 space-y-4">
          {transfers.map((transfer) => (
            <Card key={transfer.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">
                    To: {transfer.recipient_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Phone: {transfer.recipient_phone}
                  </p>
                  <p className="text-sm text-gray-500">
                    From: {transfer.profiles.full_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Email: {transfer.profiles.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created:{" "}
                    {formatDistanceToNow(new Date(transfer.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {transfer.amount} {transfer.currency}
                  </p>
                  <div className="mt-2">
                    <TransferStatusBadge status={transfer.status} />
                  </div>
                  {transfer.status === "pending" && (
                    <Button
                      className="mt-2"
                      onClick={() => processTransfer(transfer.id)}
                    >
                      Process Transfer
                    </Button>
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
