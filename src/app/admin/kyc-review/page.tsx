"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface KycSubmission {
  id: string;
  kyc_full_name: string;
  kyc_address: string;
  kyc_dob: string;
  kyc_id_type: string;
  kyc_id_number: string;
  kyc_id_expiry: string;
  kyc_id_image_url: string;
  kyc_status: "pending" | "approved" | "rejected";
  kyc_submitted_at: string;
  kyc_reviewed_at: string | null;
  kyc_notes: string | null;
  email: string;
}

function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString();
}

function ImagePreview({ imageUrl }: { imageUrl: string }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setError(null);
    setLoading(true);
  }, [imageUrl]);

  if (!imageUrl) {
    return (
      <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 bg-gray-50 rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-4">
          <div className="text-red-500 flex items-center mb-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
          {retryCount < 3 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setLoading(true);
                setRetryCount((prev) => prev + 1);
              }}
            >
              Retry Loading
            </Button>
          )}
        </div>
      ) : (
        <img
          src={imageUrl}
          alt="ID Document"
          className="w-full h-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => {
            setError("Failed to load image");
            setLoading(false);
          }}
        />
      )}
    </div>
  );
}

export default function KycReviewPage() {
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<KycSubmission | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "processed">(
    "pending"
  );

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("kyc_submitted_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data as KycSubmission[]);
    } catch (err) {
      console.error("Error fetching submissions:", err);
      toast({
        title: "Error",
        description: "Failed to fetch KYC submissions",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    void fetchSubmissions();
  }, []);

  const handleApprove = async (submission: KycSubmission) => {
    if (!submission) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          kyc_status: "approved",
          kyc_reviewed_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "KYC Approved",
        description: `KYC for ${submission.kyc_full_name} has been approved`,
      });
      await fetchSubmissions();
      setShowDialog(false);
    } catch (err) {
      console.error("Error approving submission:", err);
      toast({
        title: "Approval Failed",
        description:
          err instanceof Error
            ? err.message
            : "Failed to approve KYC submission",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (submission: KycSubmission) => {
    if (!submission || !rejectReason.trim() || rejectReason.length < 10) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          kyc_status: "rejected",
          kyc_reviewed_at: new Date().toISOString(),
          kyc_notes: rejectReason.trim(),
        })
        .eq("id", submission.id);

      if (error) throw error;

      toast({
        title: "KYC Rejected",
        description: `KYC for ${submission.kyc_full_name} has been rejected`,
      });
      await fetchSubmissions();
      setShowDialog(false);
      setRejectReason("");
    } catch (err) {
      console.error("Error rejecting submission:", err);
      toast({
        title: "Rejection Failed",
        description:
          err instanceof Error
            ? err.message
            : "Failed to reject KYC submission",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const pendingSubmissions = submissions.filter(
    (sub) => sub.kyc_status === "pending"
  );
  const processedSubmissions = submissions.filter(
    (sub) => sub.kyc_status !== "pending"
  );

  return (
    <main className="container mx-auto py-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">KYC Review Dashboard</h1>
      <Tabs
        value={activeTab}
        onValueChange={(value: "pending" | "processed") => setActiveTab(value)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            Pending
            {pendingSubmissions.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingSubmissions.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processed">Processed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending">
          <div className="grid gap-4">
            {pendingSubmissions.map((submission) => (
              <Card key={submission.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {submission.kyc_full_name}
                    </h3>
                    <p className="text-sm text-gray-500">{submission.email}</p>
                    <p className="text-sm text-gray-500">
                      Submitted: {formatDate(submission.kyc_submitted_at)}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setShowDialog(true);
                    }}
                  >
                    Review
                  </Button>
                </div>
              </Card>
            ))}
            {pendingSubmissions.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No pending submissions
              </p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="processed">
          <div className="grid gap-4">
            {processedSubmissions.map((submission) => (
              <Card key={submission.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      {submission.kyc_full_name}
                    </h3>
                    <p className="text-sm text-gray-500">{submission.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={
                          submission.kyc_status === "approved"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {submission.kyc_status === "approved" ? (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {submission.kyc_status.charAt(0).toUpperCase() +
                          submission.kyc_status.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(submission.kyc_reviewed_at || "")}
                      </span>
                    </div>
                    {submission.kyc_notes && (
                      <p className="text-sm text-gray-500 mt-2">
                        Notes: {submission.kyc_notes}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {processedSubmissions.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No processed submissions
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="sticky top-0 z-10 bg-white px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              {selectedSubmission?.kyc_full_name} - KYC Review
              <Badge variant={processing ? "outline" : "default"}>
                {processing ? "Processing..." : "Pending Review"}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Please review the following information carefully before
              proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {selectedSubmission && (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Personal Information Section */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Personal Information
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Email
                            </p>
                            <p className="text-gray-900">
                              {selectedSubmission.email}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Full Name
                            </p>
                            <p className="text-gray-900">
                              {selectedSubmission.kyc_full_name}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Address
                            </p>
                            <p className="text-gray-900">
                              {selectedSubmission.kyc_address}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Date of Birth
                            </p>
                            <p className="text-gray-900">
                              {new Date(
                                selectedSubmission.kyc_dob
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-4">
                          Submission Details
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              Submitted
                            </p>
                            <p className="text-gray-900">
                              {formatDate(selectedSubmission.kyc_submitted_at)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              ID Document Type
                            </p>
                            <p className="text-gray-900">
                              {selectedSubmission.kyc_id_type}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              ID Number
                            </p>
                            <p className="text-gray-900">
                              {selectedSubmission.kyc_id_number}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">
                              ID Expiry
                            </p>
                            <p className="text-gray-900">
                              {new Date(
                                selectedSubmission.kyc_id_expiry
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ID Document Image Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        ID Document Image
                      </h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <ImagePreview
                          imageUrl={selectedSubmission.kyc_id_image_url}
                        />
                      </div>

                      <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Review Decision
                        </h3>
                        <textarea
                          className="w-full min-h-[120px] p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter detailed reason for rejection (required for rejecting, minimum 10 characters)"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          disabled={processing}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sticky bottom-0 bg-white px-6 py-4 border-t">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="default"
                className="w-full"
                onClick={() =>
                  selectedSubmission && handleApprove(selectedSubmission)
                }
                disabled={processing}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {processing ? "Processing..." : "Approve KYC"}
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() =>
                  selectedSubmission && handleReject(selectedSubmission)
                }
                disabled={
                  processing || !rejectReason.trim() || rejectReason.length < 10
                }
              >
                <XCircle className="w-4 h-4 mr-2" />
                {processing ? "Processing..." : "Reject KYC"}
              </Button>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowDialog(false);
                setSelectedSubmission(null);
                setRejectReason("");
              }}
              disabled={processing}
            >
              Cancel Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
