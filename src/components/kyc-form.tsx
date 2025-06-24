"use client";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KycForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [postcode, setPostcode] = useState("");
  const [dob, setDob] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idExpiry, setIdExpiry] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  function nextStep() {
    setStep((s) => Math.min(s + 1, 5));
  }
  function prevStep() {
    setStep((s) => Math.max(s - 1, 1));
  }

  function validateStep() {
    if (step === 1) {
      return firstName && lastName && dob;
    }
    if (step === 2) {
      return addressLine1 && city && postcode;
    }
    if (step === 3) {
      return idType && idNumber && idExpiry;
    }
    if (step === 4) {
      return file;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 5) {
      if (!validateStep()) {
        setStatus("Please fill in all required fields for this step.");
        return;
      }
      setStatus("");
      nextStep();
      return;
    }
    setStatus("Uploading...");
    setSubmitting(true);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData || !userData.user) {
      setStatus("Not authenticated");
      setSubmitting(false);
      return;
    }
    const userId = userData.user.id;
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .upload(`${userId}/${file!.name}`, file!);
    if (error) {
      setStatus("Upload failed: " + error.message);
      setSubmitting(false);
      return;
    }
    const fullAddress = `${addressLine1}${
      addressLine2 ? ", " + addressLine2 : ""
    }, ${city}${county ? ", " + county : ""}, ${postcode}`;
    await supabase
      .from("profiles")
      .update({
        kyc_first_name: firstName,
        kyc_middle_name: middleName,
        kyc_last_name: lastName,
        kyc_address: fullAddress,
        kyc_dob: dob,
        kyc_id_type: idType,
        kyc_id_number: idNumber,
        kyc_id_expiry: idExpiry,
        kyc_id_image_url: data?.path,
        kyc_status: "pending",
        kyc_submitted_at: new Date().toISOString(),
      })
      .eq("id", userId);
    setStatus("KYC submitted! Awaiting review.");
    setSubmitting(false);
    if (onSubmitted) onSubmitted();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 border border-blue-100 rounded-3xl shadow-2xl w-full max-w-md mx-auto pt-8 pb-4 px-2 md:px-6 flex flex-col min-h-[60vh] h-auto overflow-y-auto justify-center"
      style={{ maxHeight: "90vh" }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-blue-900 text-center tracking-tight mb-2">
        KYC Verification
      </h2>
      {/* Rest of your form JSX... */}
      <div className="flex-1 flex flex-col justify-between">
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <Label htmlFor="kyc-firstname">First Name *</Label>
            <Input
              id="kyc-firstname"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g. Mariama"
              disabled={submitting}
              required
              className="text-sm py-2 px-2"
            />
            <Label htmlFor="kyc-middlename">Middle Name</Label>
            <Input
              id="kyc-middlename"
              type="text"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              placeholder="(optional)"
              disabled={submitting}
              className="text-sm py-2 px-2"
            />
            <Label htmlFor="kyc-lastname">Last Name *</Label>
            <Input
              id="kyc-lastname"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Kamara"
              disabled={submitting}
              required
              className="text-sm py-2 px-2"
            />
            <Label htmlFor="kyc-dob">Date of Birth *</Label>
            <Input
              id="kyc-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              disabled={submitting}
              required
              className="text-sm py-2 px-2"
            />
          </div>
        )}
        {/* Rest of your step components... */}
      </div>
      <div className="flex gap-2 mt-6">
        {step > 1 && (
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={submitting}
          >
            Back
          </Button>
        )}
        {step < 5 && (
          <Button
            type="button"
            onClick={() => {
              if (validateStep()) {
                setStatus("");
                nextStep();
              } else {
                setStatus("Please fill in all required fields for this step.");
              }
            }}
            disabled={submitting}
          >
            Next
          </Button>
        )}
        {step === 5 && (
          <Button type="submit" className="ml-auto" disabled={submitting}>
            {submitting ? "Uploading..." : "Submit KYC"}
          </Button>
        )}
      </div>
      {status && (
        <div
          className={`text-center text-base mt-4 ${
            status.includes("fail") || status.includes("not")
              ? "text-red-600"
              : "text-green-700"
          }`}
        >
          {status}
        </div>
      )}
    </form>
  );
}
