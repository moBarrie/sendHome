"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface MonimePayout {
  id: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  amount: {
    value: number;
    currency: string;
  };
  destination: {
    providerCode: string;
    accountId: string;
    transactionReference?: string;
  };
  source: {
    financialAccountId: string;
    transactionReference?: string;
  };
  failureDetail?: {
    code: string;
    message: string;
  };
  createTime: string;
  updateTime?: string;
  metadata?: Record<string, any>;
}

interface Transfer {
  id: string;
  amount: number;
  amount_gbp: number;
  amount_sll: number;
  fee_gbp: number;
  sendhome_fee_gbp: number;
  total_gbp: number;
  gbp_to_sll_rate: number;
  recipient_phone: string;
  recipient_name: string;
  status: string;
  monime_payout_id?: string;
  created_at: string;
  updated_at: string;
  failure_reason?: string;
  transaction_reference?: string;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
    case "cancelled":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "processing":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case "pending":
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    completed: "default",
    failed: "destructive",
    cancelled: "destructive",
    processing: "secondary",
    pending: "outline",
  };

  return (
    <Badge
      variant={variants[status] || "outline"}
      className="flex items-center gap-1"
    >
      <StatusIcon status={status} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

export default function TransferMonitoringPage() {
  const [monimePayouts, setMonimePayouts] = useState<MonimePayout[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchMonimePayouts = async () => {
    try {
      const response = await fetch("/api/monime-payouts");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch payouts");
      }

      setMonimePayouts(data.data || []);
    } catch (err) {
      console.error("Error fetching Monime payouts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch payouts");
    }
  };

  const fetchTransfers = async () => {
    try {
      const response = await fetch("/api/admin/transfers");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transfers");
      }

      setTransfers(data.transfers || []);
    } catch (err) {
      console.error("Error fetching transfers:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch transfers"
      );
    }
  };

  const syncTransferStatus = async () => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch("/api/sync-transfer-status", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync status");
      }

      console.log("Sync result:", data);
      setLastSync(new Date());

      // Refresh both datasets
      await Promise.all([fetchMonimePayouts(), fetchTransfers()]);
    } catch (err) {
      console.error("Error syncing transfer status:", err);
      setError(err instanceof Error ? err.message : "Failed to sync status");
    } finally {
      setSyncing(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([fetchMonimePayouts(), fetchTransfers()]);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!syncing && !loading) {
        syncTransferStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [syncing, loading]);

  const formatAmount = (amount: number, currency: string = "SLE") => {
    if (currency === "GBP") {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "GBP",
        minimumFractionDigits: 2,
      }).format(amount); // GBP amounts are stored as decimal values
    } else {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "SLE",
        minimumFractionDigits: 2,
      }).format(amount / 100); // SLE amounts are stored in smallest unit (cents)
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith("+232")) {
      return phone;
    }
    return `+232${phone}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading transfer data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payout Transfer List</h1>
          <p className="text-gray-600 mt-1">
            Monitor Monime payouts, sync transfer statuses, and view detailed
            transfer information
          </p>
        </div>
        <div className="flex items-center gap-2">
          {lastSync && (
            <span className="text-sm text-gray-500">
              Last sync: {formatDistanceToNow(lastSync, { addSuffix: true })}
            </span>
          )}
          <Button
            onClick={syncTransferStatus}
            disabled={syncing}
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync Status"}
          </Button>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monimePayouts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {monimePayouts.filter((p) => p.status === "completed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {
                monimePayouts.filter(
                  (p) => p.status === "processing" || p.status === "pending"
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {
                monimePayouts.filter(
                  (p) => p.status === "failed" || p.status === "cancelled"
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="monime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="monime">Monime Payouts</TabsTrigger>
          <TabsTrigger value="transfers">Database Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="monime" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monime Payouts</CardTitle>
              <CardDescription>
                Real-time payout status from Monime API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monimePayouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {formatPhoneNumber(payout.destination.accountId)}
                        </span>
                        <StatusBadge status={payout.status} />
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>
                          Amount:{" "}
                          {formatAmount(
                            payout.amount.value,
                            payout.amount.currency
                          )}
                        </p>
                        <p>Provider: {payout.destination.providerCode}</p>
                        <p>
                          Created:{" "}
                          {formatDistanceToNow(new Date(payout.createTime), {
                            addSuffix: true,
                          })}
                        </p>
                        {payout.updateTime && (
                          <p>
                            Updated:{" "}
                            {formatDistanceToNow(new Date(payout.updateTime), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                        {payout.failureDetail && (
                          <p className="text-red-600 font-medium">
                            Error ({payout.failureDetail.code}):{" "}
                            {payout.failureDetail.message}
                          </p>
                        )}
                        {payout.destination.transactionReference && (
                          <p className="font-mono text-xs">
                            Ref: {payout.destination.transactionReference}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(payout.id)}
                      >
                        Copy ID
                      </Button>
                    </div>
                  </div>
                ))}
                {monimePayouts.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No payouts found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Local Transfers</CardTitle>
              <CardDescription>
                Transfers from your database with Monime sync status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {transfer.recipient_name}
                        </span>
                        <StatusBadge status={transfer.status} />
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>
                          Phone: {formatPhoneNumber(transfer.recipient_phone)}
                        </p>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <p>Paid: {formatAmount(transfer.total_gbp, "GBP")}</p>
                          <p>
                            Received: {formatAmount(transfer.amount_sll, "SLE")}
                          </p>
                          <p>
                            Send: {formatAmount(transfer.amount_gbp, "GBP")}
                          </p>
                          <p>
                            Fee:{" "}
                            {formatAmount(
                              transfer.fee_gbp + transfer.sendhome_fee_gbp,
                              "GBP"
                            )}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Rate: 1 GBP ={" "}
                          {transfer.gbp_to_sll_rate?.toLocaleString() || "N/A"}{" "}
                          SLE
                        </p>
                        <p>
                          Created:{" "}
                          {formatDistanceToNow(new Date(transfer.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                        {transfer.updated_at !== transfer.created_at && (
                          <p>
                            Updated:{" "}
                            {formatDistanceToNow(
                              new Date(transfer.updated_at),
                              {
                                addSuffix: true,
                              }
                            )}
                          </p>
                        )}
                        {transfer.monime_payout_id && (
                          <p className="font-mono text-xs">
                            Monime: {transfer.monime_payout_id}
                          </p>
                        )}
                        {transfer.failure_reason && (
                          <p className="text-red-600 font-medium">
                            Error: {transfer.failure_reason}
                          </p>
                        )}
                        {transfer.transaction_reference && (
                          <p className="font-mono text-xs">
                            Ref: {transfer.transaction_reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {transfer.monime_payout_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              transfer.monime_payout_id!
                            )
                          }
                        >
                          Copy Monime ID
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {transfers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No transfers found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
