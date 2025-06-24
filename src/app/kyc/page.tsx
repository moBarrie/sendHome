"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function KycPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setStatus("Please select a file.");
    setStatus("Uploading...");
    // Upload to Supabase Storage (adjust bucket name as needed)
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .upload(`docs/${file.name}`, file);
    if (error) return setStatus("Upload failed: " + error.message);
    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) return setStatus("Not authenticated");
    const userId = userData.user.id;
    // Update profile with document URL and set status to 'pending'
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
    <form onSubmit={handleSubmit}>
      <h2>KYC Verification</h2>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <button type="submit">Submit Document</button>
      <div>{status}</div>
    </form>
  );
}
