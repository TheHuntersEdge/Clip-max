import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

/**
 * NextAuth (Auth.js v5) configuration.
 *
 * Phase 0 ships with the GitHub provider wired through env vars
 * (AUTH_GITHUB_ID / AUTH_GITHUB_SECRET). Add more providers as needed.
 * Sessions are persisted to Postgres via the Prisma adapter.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  // The generated Prisma client lives at a custom output path, so its
  // type differs slightly from the adapter's expected PrismaClient.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  providers: [GitHub],
  session: { strategy: "database" },
});
