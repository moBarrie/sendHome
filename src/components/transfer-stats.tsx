"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface TransferStats {
  totalTransfers: number;
  totalAmount: number;
  completedTransfers: number;
  pendingTransfers: number;
  failedTransfers: number;
  thisMonthTransfers: number;
  thisMonthAmount: number;
  averageAmount: number;
}

export function TransferStats({ userId }: { userId?: string }) {
  const [stats, setStats] = useState<TransferStats>({
    totalTransfers: 0,
    totalAmount: 0,
    completedTransfers: 0,
    pendingTransfers: 0,
    failedTransfers: 0,
    thisMonthTransfers: 0,
    thisMonthAmount: 0,
    averageAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    async function fetchStats() {
      try {
        const { data: transfers, error } = await supabase
          .from("transfers")
          .select("amount_gbp, amount, status, created_at")
          .eq("user_id", userId);

        if (error) {
          console.error("Error fetching transfer stats:", error);
          return;
        }

        if (!transfers) return;

        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats: TransferStats = {
          totalTransfers: transfers.length,
          totalAmount: transfers.reduce(
            (sum, t) => sum + (t.amount_gbp || t.amount || 0),
            0
          ),
          completedTransfers: transfers.filter((t) => t.status === "completed")
            .length,
          pendingTransfers: transfers.filter(
            (t) => t.status === "pending" || t.status === "processing"
          ).length,
          failedTransfers: transfers.filter((t) => t.status === "failed")
            .length,
          thisMonthTransfers: transfers.filter(
            (t) => new Date(t.created_at) >= thisMonth
          ).length,
          thisMonthAmount: transfers
            .filter((t) => new Date(t.created_at) >= thisMonth)
            .reduce((sum, t) => sum + (t.amount_gbp || t.amount || 0), 0),
          averageAmount:
            transfers.length > 0
              ? transfers.reduce(
                  (sum, t) => sum + (t.amount_gbp || t.amount || 0),
                  0
                ) / transfers.length
              : 0,
        };

        setStats(stats);
      } catch (error) {
        console.error("Error calculating stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();

    // Subscribe to changes to update stats in real-time
    const subscription = supabase
      .channel(`transfer-stats-${userId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transfers",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const successRate =
    stats.totalTransfers > 0
      ? (stats.completedTransfers / stats.totalTransfers) * 100
      : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Total Sent</p>
            <p className="text-2xl font-bold text-blue-900">
              £{stats.totalAmount.toFixed(2)}
            </p>
          </div>
          <DollarSign className="h-8 w-8 text-blue-500" />
        </div>
        <div className="mt-2">
          <p className="text-xs text-blue-600">
            {stats.totalTransfers} transfer
            {stats.totalTransfers !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600">Completed</p>
            <p className="text-2xl font-bold text-green-900">
              {stats.completedTransfers}
            </p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <div className="mt-2">
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-700 text-xs"
          >
            {successRate.toFixed(1)}% success rate
          </Badge>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-900">
              {stats.pendingTransfers}
            </p>
          </div>
          <Clock className="h-8 w-8 text-yellow-500" />
        </div>
        <div className="mt-2">
          <p className="text-xs text-yellow-600">
            {stats.failedTransfers} failed
          </p>
        </div>
      </Card>

      <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600">This Month</p>
            <p className="text-2xl font-bold text-purple-900">
              £{stats.thisMonthAmount.toFixed(2)}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-purple-500" />
        </div>
        <div className="mt-2">
          <p className="text-xs text-purple-600">
            {stats.thisMonthTransfers} transfer
            {stats.thisMonthTransfers !== 1 ? "s" : ""}
          </p>
        </div>
      </Card>
    </div>
  );
}
