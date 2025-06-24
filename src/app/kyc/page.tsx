"use client";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const KycForm = dynamic(
  () => import("@/components/kyc-form").then((mod) => mod.KycForm),
  { ssr: false }
);

export default function KycPage({
  onSubmitted,
}: { onSubmitted?: () => void } = {}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 fixed inset-0 z-0">
      <div className="flex items-center justify-center w-full h-full p-4 md:p-8">
        <Suspense fallback={<div>Loading...</div>}>
          <KycForm onSubmitted={onSubmitted} />
        </Suspense>
      </div>
    </div>
  );
}
