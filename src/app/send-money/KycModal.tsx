"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function KycModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setStatus("Please select a file.");
    setStatus("Uploading...");
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .upload(`docs/${file.name}`, file);
    if (error) return setStatus("Upload failed: " + error.message);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return setStatus("Not authenticated");
    const userId = userData.user.id;
    await supabase
      .from("profiles")
      .update({
        kyc_document_url: data?.path,
        kyc_status: "pending",
        kyc_submitted_at: new Date().toISOString(),
      })
      .eq("id", userId);
    setStatus("Document uploaded! Awaiting review.");
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-xl w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">KYC Verification</h2>
        <input
          type="file"
          accept="image/*,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Submit Document
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 px-4 py-2 rounded border"
        >
          Cancel
        </button>
        <div className="mt-2 text-sm text-gray-700">{status}</div>
      </form>
    </div>
  );
}
