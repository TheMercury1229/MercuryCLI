"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ApproveVerificationPage() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userCode = searchParams.get("user_code");

  const [isProcessing, setIsProcessing] = useState({
    approve: false,
    deny: false,
  });

  const handleApprove = async () => {
    setIsProcessing({ deny: false, approve: true });
    try {
      toast.loading("Approving device...", { id: "loading-approve" });
      await authClient.device.approve({ userCode: userCode! });
      toast.dismiss("loading-approve");
      toast.success("Device approved successfully!", { id: "success-approve" });
      router.push("/");
    } catch (error) {
      toast.dismiss("loading-approve");
      toast.error("Failed to approve device.");
    } finally {
      setIsProcessing({ deny: false, approve: false });
    }
  };
  const handleDeny = async () => {
    setIsProcessing({ approve: false, deny: true });
    try {
      toast.loading("Denying device...", { id: "loading-deny" });
      await authClient.device.deny({ userCode: userCode! });
      toast.dismiss("loading-deny");
      toast.success("Device denied successfully!", { id: "success-deny" });
      router.push("/");
    } catch (error) {
      toast.dismiss("loading-deny");
      toast.error("Failed to deny device.");
    } finally {
      setIsProcessing({ approve: false, deny: false });
    }
  };
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }
  if (!isPending && !data?.user) {
    return router.push(`/sign-in?redirect=/device?user_code=${userCode}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background font-sans">
      <div className="w-full max-w-md px-4 my-12">
        <div className="space-y-8">
          {/* Title and Description */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-zinc-50">
              Device Authorization
            </h1>
            <p className="text-sm text-zinc-400">
              A new device is requesting access to your account.
            </p>
          </div>
          {/* Device Code Card */}
          <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-900/50 backdrop-blur-sm space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Authorization Code
              </p>
              <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
                <p className="text-xl font-mono font-bold text-cyan-400 text-center tracking-widest">
                  {userCode || "---"}
                </p>
              </div>
              <p className="text-xs text-zinc-600 text-center">
                Share this code with the requesting device
              </p>
            </div>
          </div>
          {/* Security Info Card */}
          <div className="border-2 border-dashed border-zinc-700 rounded-2xl p-6 bg-zinc-900/50 backdrop-blur-sm">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-zinc-500 tracking-wide">
                Account:{data?.user?.email}
              </p>
              <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
                <p className="text-sm text-zinc-300">
                  Only approve this request if you initiated it. For security
                  reasons, do not share this code with anyone you do not trust.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleApprove}
              disabled={isProcessing.approve}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing.approve ? (
                <>
                  <Spinner className="size-5" />
                  <span>Approving...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="size-5" />
                  <span>Approve Device</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleDeny}
              disabled={isProcessing.deny}
              className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing.deny ? (
                <>
                  <Spinner className="size-5" />
                  <span>Denying...</span>
                </>
              ) : (
                <>
                  <XCircle className="size-5" />
                  <span>Deny Device</span>
                </>
              )}
            </Button>
          </div>
          {/* Decorative divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px border-t border-dashed border-zinc-700"></div>
            <span className="text-xs text-zinc-600">Choose wisely</span>
            <div className="flex-1 h-px border-t border-dashed border-zinc-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
