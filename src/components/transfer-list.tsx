"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { TransferStatusBadge } from "@/components/transfer-status-badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

interface Transfer {
  id: string;
  recipient_name: string;
  recipient_phone: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

export function TransferList() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    // Fetch initial transfers
    async function fetchTransfers() {
      const { data, error } = await supabase
        .from("transfers")
        .select("*")
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
      const channelName = `transfers-list-${Math.random()
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
          (payload) => {
            if (!isMounted) return;

            if (payload.eventType === "INSERT") {
              setTransfers((current) => [payload.new as Transfer, ...current]);
            } else if (payload.eventType === "UPDATE") {
              setTransfers((current) =>
                current.map((transfer) =>
                  transfer.id === payload.new.id
                    ? (payload.new as Transfer)
                    : transfer
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
  }, []);

  return (
    <ScrollArea className="h-[600px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {transfers.map((transfer) => (
          <Card key={transfer.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{transfer.recipient_name}</h3>
                <p className="text-sm text-gray-500">
                  {transfer.recipient_phone}
                </p>
                <p className="text-sm text-gray-500">
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
              </div>
            </div>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
