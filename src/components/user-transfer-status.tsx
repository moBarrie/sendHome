'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Transfer {
  id: string;
  amount: number;
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
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'processing':
      return <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />;
    case 'pending':
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    completed: 'default',
    failed: 'destructive',
    processing: 'secondary',
    pending: 'outline'
  };

  const colors: Record<string, string> = {
    completed: 'bg-green-50 text-green-700 border-green-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    processing: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    pending: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${colors[status] || colors.pending}`}>
      <StatusIcon status={status} />
      {status === 'completed' && 'Completed'}
      {status === 'failed' && 'Failed'}
      {status === 'processing' && 'Processing'}
      {status === 'pending' && 'Pending'}
    </div>
  );
};

const getStatusMessage = (status: string, failureReason?: string, transactionRef?: string) => {
  switch (status) {
    case 'completed':
      return transactionRef 
        ? `Transfer completed successfully. Transaction reference: ${transactionRef}`
        : 'Transfer completed successfully. The recipient should have received the funds.';
    case 'failed':
      return failureReason 
        ? `Transfer failed: ${failureReason}`
        : 'Transfer failed. Please contact support if you need assistance.';
    case 'processing':
      return 'Your transfer is being processed by our payment partner. This usually takes a few minutes.';
    case 'pending':
    default:
      return 'Your transfer is queued for processing. We\'ll update you as soon as it starts processing.';
  }
};

interface UserTransferStatusProps {
  userId?: string;
  autoRefresh?: boolean;
}

export default function UserTransferStatus({ userId, autoRefresh = true }: UserTransferStatusProps) {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransfers = async () => {
    try {
      const url = userId ? `/api/user-transfers?userId=${userId}` : '/api/user-transfers';
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transfers');
      }

      setTransfers(data.transfers || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch transfers');
    }
  };

  const refreshTransfers = async () => {
    setRefreshing(true);
    await fetchTransfers();
    setRefreshing(false);
  };

  const loadData = async () => {
    setLoading(true);
    await fetchTransfers();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!loading && !refreshing) {
        fetchTransfers();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, loading, refreshing]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SLE',
      minimumFractionDigits: 2,
    }).format(amount / 100);
  };

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+232')) {
      return phone;
    }
    return `+232${phone}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Loading your transfers...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Transfers</h2>
          <p className="text-gray-600">Track the status of your money transfers</p>
        </div>
        <Button
          onClick={refreshTransfers}
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {transfers.map((transfer) => (
          <Card key={transfer.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {transfer.recipient_name}
                  </CardTitle>
                  <CardDescription>
                    {formatPhoneNumber(transfer.recipient_phone)} • {formatAmount(transfer.amount)}
                  </CardDescription>
                </div>
                <StatusBadge status={transfer.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">
                    {getStatusMessage(transfer.status, transfer.failure_reason, transfer.transaction_reference)}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span>
                      Sent {formatDistanceToNow(new Date(transfer.created_at), { addSuffix: true })}
                    </span>
                    {transfer.updated_at !== transfer.created_at && (
                      <span>
                        Updated {formatDistanceToNow(new Date(transfer.updated_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </div>

                {transfer.status === 'failed' && (
                  <Alert>
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      This transfer failed. You can try sending again or contact support for help.
                    </AlertDescription>
                  </Alert>
                )}

                {transfer.status === 'processing' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Your transfer is being processed. The recipient will receive an SMS confirmation once completed.
                    </AlertDescription>
                  </Alert>
                )}

                {transfer.status === 'completed' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Transfer completed! The recipient has received the funds.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {transfers.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No transfers yet</h3>
                <p>Your money transfers will appear here once you send them.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {autoRefresh && transfers.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Status updates automatically every 30 seconds
        </div>
      )}
    </div>
  );
}
