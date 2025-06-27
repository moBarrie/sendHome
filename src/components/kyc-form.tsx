"use client";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { RealtimeChannel } from "@supabase/supabase-js";

import { useToast } from "@/hooks/use-toast";

export function KycForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
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

    try {
      setStatus("Uploading...");
      setSubmitting(true);

      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData || !userData.user) {
        throw new Error("Not authenticated");
      }
      const userId = userData.user.id;

      // Create a unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileExtension = file!.name.split(".").pop();
      const uniqueFilename = `${userId}_${timestamp}.${fileExtension}`;

      // Upload ID document with unique filename
      const { data: fileData, error: uploadError } = await supabase.storage
        .from("kyc-documents")
        .upload(`${userId}/${uniqueFilename}`, file!);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Format the address
      const fullAddress = [addressLine1, addressLine2, city, county, postcode]
        .filter(Boolean)
        .join(", ");

      // Update profile with KYC information
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          // KYC information
          kyc_full_name: `${firstName} ${
            middleName ? middleName + " " : ""
          }${lastName}`.trim(),
          kyc_address: fullAddress,
          kyc_dob: dob,
          kyc_id_type: idType,
          kyc_id_number: idNumber,
          kyc_id_expiry: idExpiry,
          kyc_id_image_url: `${userId}/${uniqueFilename}`,
          kyc_status: "pending",
          kyc_submitted_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`);
      }

      setStatus("KYC submitted successfully! Redirecting to profile...");

      // Wait a moment to show the success message
      await new Promise((resolve) => setTimeout(resolve, 1500));

      if (onSubmitted) {
        onSubmitted();
      }

      // Redirect to profile page
      router.push("/profile");
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
      setSubmitting(false);
    }
  }

  // Subscribe to KYC status changes
  useEffect(() => {
    let isMounted = true;
    let subscription: RealtimeChannel | null = null;

    async function setupSubscription() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id || !isMounted) return;

      // Create a unique channel name to avoid conflicts
      const channelName = `kyc-status-${session.user.id}-${Math.random()
        .toString(36)
        .substring(7)}`;

      subscription = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${session.user.id}`,
          },
          (payload: any) => {
            if (!isMounted) return;

            const newStatus = payload.new.kyc_status;
            const notes = payload.new.kyc_notes;

            if (newStatus === "approved") {
              toast({
                title: "KYC Approved! 🎉",
                description:
                  "Your identity verification has been approved. You can now make transfers.",
                variant: "default",
              });
              router.push("/dashboard");
            } else if (newStatus === "rejected") {
              toast({
                title: "KYC Rejected",
                description: notes
                  ? `Reason: ${notes}`
                  : "Please review and resubmit your information.",
                variant: "destructive",
              });
            }
          }
        )
        .subscribe();
    }

    setupSubscription();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [router, toast]);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/95 border border-blue-100 rounded-3xl shadow-2xl w-full max-w-md mx-auto pt-8 pb-4 px-2 md:px-6 flex flex-col min-h-[60vh] h-auto overflow-y-auto justify-center"
      style={{ maxHeight: "90vh" }}
    >
      <h2 className="text-2xl md:text-3xl font-bold text-blue-900 text-center tracking-tight mb-2">
        KYC Verification
      </h2>
      <p className="text-gray-500 text-center mb-8">Step {step} of 5</p>

      <div className="flex-1 flex flex-col gap-3">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="kyc-firstname">First Name *</Label>
              <Input
                id="kyc-firstname"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="kyc-middlename">Middle Name (Optional)</Label>
              <Input
                id="kyc-middlename"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="William"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="kyc-lastname">Last Name *</Label>
              <Input
                id="kyc-lastname"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="kyc-dob">Date of Birth *</Label>
              <Input
                id="kyc-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="kyc-address1">Address Line 1 *</Label>
              <Input
                id="kyc-address1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="123 Main St"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="kyc-address2">Address Line 2</Label>
              <Input
                id="kyc-address2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Apt 4B"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="kyc-city">City *</Label>
              <Input
                id="kyc-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="London"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="kyc-county">County</Label>
              <Input
                id="kyc-county"
                value={county}
                onChange={(e) => setCounty(e.target.value)}
                placeholder="Greater London"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="kyc-postcode">Postal Code *</Label>
              <Input
                id="kyc-postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="SW1A 1AA"
                required
                className="mt-1"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="kyc-idtype">ID Type *</Label>
              <Input
                id="kyc-idtype"
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                placeholder="Passport"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="kyc-idnumber">ID Number *</Label>
              <Input
                id="kyc-idnumber"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="123456789"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="kyc-idexpiry">ID Expiry Date *</Label>
              <Input
                id="kyc-idexpiry"
                type="date"
                value={idExpiry}
                onChange={(e) => setIdExpiry(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="kyc-document">Upload ID Document *</Label>
              <Input
                id="kyc-document"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="mt-1"
                accept="image/*,.pdf"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Your Information</h3>
            <div className="space-y-2">
              <p>
                <strong>Name:</strong> {firstName} {middleName} {lastName}
              </p>
              <p>
                <strong>Date of Birth:</strong> {dob}
              </p>
              <p>
                <strong>Address:</strong> {addressLine1}
              </p>
              {addressLine2 && <p>{addressLine2}</p>}
              <p>
                {city}, {county}
              </p>
              <p>{postcode}</p>
              <p>
                <strong>ID Type:</strong> {idType}
              </p>
              <p>
                <strong>ID Number:</strong> {idNumber}
              </p>
              <p>
                <strong>ID Expiry:</strong> {idExpiry}
              </p>
              <p>
                <strong>Document:</strong> {file?.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {status && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            status.includes("Error")
              ? "bg-red-100 text-red-800"
              : status.includes("success")
              ? "bg-green-100 text-green-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {status}
        </div>
      )}

      <div className="flex justify-between mt-6">
        {step > 1 && (
          <Button type="button" variant="outline" onClick={prevStep}>
            Back
          </Button>
        )}
        <Button
          type="submit"
          disabled={submitting}
          className={step > 1 ? "ml-auto" : "w-full"}
        >
          {step < 5 ? "Next" : submitting ? "Submitting..." : "Submit KYC"}
        </Button>
      </div>
    </form>
  );
}
