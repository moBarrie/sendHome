"use client";

import { useTransferStatus } from "@/hooks/use-transfer-status";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface TransferStatusProps {
  transferId: string;
}

export function TransferStatus({ transferId }: TransferStatusProps) {
  const { status, isLoading } = useTransferStatus(transferId);

  if (isLoading) {
    return (
      <Badge variant="outline" className="gap-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Checking status...
      </Badge>
    );
  }

  switch (status) {
    case "completed":
      return (
        <Badge variant="default" className="gap-2 bg-green-500">
          <CheckCircle className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="gap-2">
          <XCircle className="h-3 w-3" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="default" className="gap-2">
          <Loader2 className="h-3 w-3 animate-spin" />
          Processing
        </Badge>
      );
  }
}
