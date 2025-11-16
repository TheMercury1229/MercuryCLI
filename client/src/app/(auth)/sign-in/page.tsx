"use client";
import { LoginForm } from "@/components/login-form";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignInPage() {
  const { data, isPending } = authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }
  if (data?.session || data?.user) {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      router.push(redirect);
    } else {
      router.push("/");
    }
  }
  return (
    <>
      <LoginForm redirect={searchParams.get("redirect") || undefined} />
    </>
  );
}
