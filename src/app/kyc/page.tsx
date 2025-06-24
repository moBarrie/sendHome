"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function KycPage({
  onSubmitted,
}: { onSubmitted?: () => void } = {}) {
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
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .upload(`docs/${file!.name}`, file!);
    if (error) {
      setStatus("Upload failed: " + error.message);
      setSubmitting(false);
      return;
    }
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData || !userData.user) {
      setStatus("Not authenticated");
      setSubmitting(false);
      return;
    }
    const userId = userData.user.id;
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 fixed inset-0 z-0">
      <form
        onSubmit={handleSubmit}
        className="bg-white/95 border border-blue-100 rounded-3xl shadow-2xl w-full max-w-md mx-auto pt-10 pb-6 px-4 md:px-10 flex flex-col min-h-[60vh] h-auto overflow-y-auto"
        style={{ maxHeight: "90vh" }}
      >
        <h2 className="text-3xl md:text-4xl font-bold text-blue-900 text-center tracking-tight mb-2">
          KYC Verification
        </h2>
        <div className="flex-1 flex flex-col justify-between">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <Label htmlFor="kyc-firstname">First Name *</Label>
              <Input
                id="kyc-firstname"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Mariama"
                disabled={submitting}
                required
              />
              <Label htmlFor="kyc-middlename">Middle Name</Label>
              <Input
                id="kyc-middlename"
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="(optional)"
                disabled={submitting}
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
              />
              <Label htmlFor="kyc-dob">Date of Birth *</Label>
              <Input
                id="kyc-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <Label htmlFor="kyc-address1">Address Line 1 *</Label>
              <Input
                id="kyc-address1"
                type="text"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="Flat 2, 123 Example St"
                disabled={submitting}
                required
              />
              <Label htmlFor="kyc-address2">Address Line 2</Label>
              <Input
                id="kyc-address2"
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="(optional)"
                disabled={submitting}
              />
              <Label htmlFor="kyc-city">City/Town *</Label>
              <Input
                id="kyc-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="London"
                disabled={submitting}
                required
              />
              <Label htmlFor="kyc-county">County</Label>
              <Input
                id="kyc-county"
                type="text"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="(optional)"
                disabled={submitting}
              />
              <Label htmlFor="kyc-postcode">Postcode *</Label>
              <Input
                id="kyc-postcode"
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="SW1A 1AA"
                disabled={submitting}
                required
              />
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <Label htmlFor="kyc-idtype">ID Type *</Label>
              <Input
                id="kyc-idtype"
                type="text"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                placeholder="Passport, Driver's License, etc."
                disabled={submitting}
                required
              />
              <Label htmlFor="kyc-idnumber">ID Number *</Label>
              <Input
                id="kyc-idnumber"
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="ID Number"
                disabled={submitting}
                required
              />
              <Label htmlFor="kyc-idexpiry">ID Expiry Date *</Label>
              <Input
                id="kyc-idexpiry"
                type="date"
                value={idExpiry}
                onChange={(e) => setIdExpiry(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          )}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <Label htmlFor="kyc-file">ID Document (photo or PDF) *</Label>
              <Input
                id="kyc-file"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mb-2"
                disabled={submitting}
                required
              />
            </div>
          )}
          {step === 5 && (
            <div className="flex flex-col gap-4 text-sm text-gray-700">
              <div>
                <b>First Name:</b> {firstName}
              </div>
              {middleName && (
                <div>
                  <b>Middle Name:</b> {middleName}
                </div>
              )}
              <div>
                <b>Last Name:</b> {lastName}
              </div>
              <div>
                <b>Date of Birth:</b> {dob}
              </div>
              <div>
                <b>Address:</b> {addressLine1}
                {addressLine2 && ", " + addressLine2}, {city}
                {county && ", " + county}, {postcode}
              </div>
              <div>
                <b>ID Type:</b> {idType}
              </div>
              <div>
                <b>ID Number:</b> {idNumber}
              </div>
              <div>
                <b>ID Expiry:</b> {idExpiry}
              </div>
              <div>
                <b>ID Document:</b> {file?.name}
              </div>
            </div>
          )}
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
                  setStatus(
                    "Please fill in all required fields for this step."
                  );
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
    </div>
  );
}
