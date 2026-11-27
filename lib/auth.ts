import { headers } from "next/headers";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  trustedOrigins: [
    "http://localhost:3000",
    "http://10.136.56.1:3000",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ],
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
});

export async function getAuthSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
