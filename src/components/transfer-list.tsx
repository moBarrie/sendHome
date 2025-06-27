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

interface TransferListProps {
  userId?: string;
}

export function TransferList({ userId }: TransferListProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    let isMounted = true;
    let subscription: any = null;

    // Fetch initial transfers
    async function fetchTransfers() {
      let query = supabase
        .from("transfers")
        .select("*")
        .order("created_at", { ascending: false });

      // Filter by user if userId is provided
      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching transfers:", error);
        return;
      }

      if (isMounted) {
        setTransfers(data || []);
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

            // Only process events for the current user if userId is provided
            if (userId && payload.new && payload.new.user_id !== userId) {
              return;
            }

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
  }, [userId]);

  return (
    <ScrollArea className="h-[400px] w-full rounded-md p-2">
      <div className="space-y-4">
        {transfers.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
              />
            </svg>
            <p className="text-gray-500">No transfers yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your transfers will appear here
            </p>
          </div>
        ) : (
          transfers.map((transfer) => (
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
          ))
        )}
      </div>
    </ScrollArea>
  );
}
