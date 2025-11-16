import { createAuthClient } from "better-auth/react";
import { deviceAuthorizationClient } from "better-auth/plugins";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3005",
  plugins: [deviceAuthorizationClient()],
});
