import type { SiteRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Étend les types NextAuth pour inclure notre id utilisateur interne et le rôle du site
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      siteRole: SiteRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    siteRole?: SiteRole;
  }
}
