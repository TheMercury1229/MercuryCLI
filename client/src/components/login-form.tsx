"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { GithubIcon } from "lucide-react";
export const LoginForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex flex-col gap-6 justify-center items-center">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Image
          src={"/login.png"}
          alt="Login"
          height={400}
          width={400}
          className="rounded-xl"
        />
        <h1 className="text-6xl font-extrabold text-purple-400">
          Welcome Back to Mercury CLI!
        </h1>
        <p className="text-base font-medium text-zinc-400">
          Login to your account for allowing device flow
        </p>
      </div>
      <Card className="border-dashed border-2">
        <CardContent>
          <div className="grid gap-6">
            <div className="flex flex-col gap-4">
              <Button
                variant={"outline"}
                className="w-full h-full"
                onClick={() =>
                  authClient.signIn.social({
                    provider: "github",
                    callbackURL: process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL!,
                  })
                }
              >
                <GithubIcon className="h-4" />
                Continue with GitHub
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
