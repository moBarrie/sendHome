"use client";

import { Badge } from "@/components/ui/badge";

type TransferStatus = "pending" | "processing" | "completed" | "failed";

interface TransferStatusBadgeProps {
  status: TransferStatus;
}

export function TransferStatusBadge({ status }: TransferStatusBadgeProps) {
  const variants: Record<TransferStatus, { className: string; label: string }> =
    {
      pending: {
        className: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Pending",
      },
      processing: {
        className: "bg-blue-100 text-blue-800 border-blue-200",
        label: "Processing",
      },
      completed: {
        className: "bg-green-100 text-green-800 border-green-200",
        label: "Completed",
      },
      failed: {
        className: "bg-red-100 text-red-800 border-red-200",
        label: "Failed",
      },
    };

  const { className, label } = variants[status];

  return <Badge className={className}>{label}</Badge>;
}
