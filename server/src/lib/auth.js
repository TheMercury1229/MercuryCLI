import { betterAuth } from "better-auth";
import { deviceAuthorization } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db.js";
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  basePath: "/api/auth",
  trustedOrigins: [process.env.FRONTEND_URL || "http://localhost:3000"],
  plugins: [
    deviceAuthorization({
      expiresIn: "15m",
      interval: "5s",
    }),
  ],
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
});
