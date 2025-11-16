"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function VerifyDevicePage() {
  const [userCode, setUserCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data, isPending } = authClient.useSession();

  const router = useRouter();

  if (!isPending && !data?.user) {
    return router.push(`/sign-in?redirect=/device`);
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formattedCode = userCode.trim().replace(/-/g, "").toUpperCase();
      const response = await authClient.device({
        query: { user_code: formattedCode },
      });
      if (response.data) {
        router.push(`/approve?user_code=${formattedCode}`);
      }
    } catch (error) {
      setError("Invalid or expired device code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleCodeChange = (e: any) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length > 4) {
      value = value.slice(0, 4) + "-" + value.slice(4, 8);
    }
    setUserCode(value);
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="p-3 rounded-lg border-2 border-dashed border-zinc-900">
            <ShieldAlert className="size-8 text-yellow-800" />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Device Authorization
            </h1>
            <p className="text-muted-foreground">
              Enter your device code to continue
            </p>
          </div>
        </div>
        {/* Form Section */}
        <form
          onSubmit={handleSubmit}
          className="border-2 border-dashed border-zinc-700 rounded-xl p-8 bg-zinc-950 backdrop-blur-sm"
        >
          <div className="space-y-6">
            <div>
              <Label
                htmlFor="code"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Device Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="XXXX-XXXX"
                maxLength={9}
                value={userCode}
                onChange={handleCodeChange}
                className="w-full px-4 py-3 bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-zinc-600 font-mono text-center text-lg tracking-wider"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Find this code on the device you want to authorize.
              </p>
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-950 border border-red-900 text-red-200 text-sm">
                {error}
              </div>
            )}
            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || userCode.length < 9}
              className="w-full p-4 bg-zinc-100 text-zinc-950 font-semibold rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Verifying..." : "Continue"}
            </Button>
            {/* Note Section */}
            <div className="p-4 bg-zinc-950 border-2 border-dashed border-zinc-900 rounded-lg">
              <p className="text-xs text-muted-foreground leading-relaxed">
                This code is unique to your device and will expire shortly.Keep
                it confidential and don&apos;t share it with anyone .
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
