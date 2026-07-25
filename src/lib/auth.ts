import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";
import { fetchGuildMember, memberHasRole } from "./discord";
import type { SiteRole } from "@prisma/client";

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!
    })
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
    error: "/" // les erreurs (ex: pas le bon rôle Discord) renvoient vers l'accueil avec ?error=
  },
  callbacks: {
    // Autorise la connexion de tout compte Discord : les membres de guilde
    // (rôle Discord Member/Officers) obtiennent le rôle site correspondant,
    // tous les autres deviennent CANDIDAT (cantonné à /candidature par le
    // garde-fou de src/app/(app)/layout.tsx). Seule une vraie erreur d'appel
    // à l'API Discord bloque encore la connexion.
    async signIn({ user, account }) {
      if (!account?.providerAccountId) return false;

      let member;
      try {
        member = await fetchGuildMember(account.providerAccountId);
      } catch (err) {
        console.error("Erreur de vérification Discord :", err);
        return false;
      }

      let defaultRole: SiteRole = "CANDIDAT";
      if (member) {
        const [isRaideur, isOfficier] = await Promise.all([
          memberHasRole(member, process.env.DISCORD_ROLE_RAIDEUR || "Raideur"),
          memberHasRole(member, process.env.DISCORD_ROLE_OFFICIER || "Officier")
        ]);
        if (isOfficier) defaultRole = "OFFICIER";
        else if (isRaideur) defaultRole = "RAIDEUR";
      }

      // Crée ou met à jour l'utilisateur en base.
      // Le rôle "site" par défaut suit le rôle Discord le plus élevé détecté,
      // mais reste ensuite géré manuellement par un Administrateur (cf. /admin) :
      // un Officier rétrogradé sur Discord ne perd pas automatiquement ses droits
      // au moindre décalage de synchronisation, et un CANDIDAT accepté n'est
      // promu Raideur que manuellement une fois invité sur le Discord.
      const existing = await prisma.user.findUnique({
        where: { discordId: account.providerAccountId }
      });

      await prisma.user.upsert({
        where: { discordId: account.providerAccountId },
        update: {
          discordTag: user.name ?? "Inconnu",
          avatarUrl: user.image ?? null
        },
        create: {
          discordId: account.providerAccountId,
          discordTag: user.name ?? "Inconnu",
          avatarUrl: user.image ?? null,
          siteRole: existing ? existing.siteRole : defaultRole
        }
      });

      return true;
    },

    async jwt({ token, account }) {
      if (account?.providerAccountId) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: account.providerAccountId }
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.siteRole = dbUser.siteRole;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.userId) {
        session.user.id = token.userId as string;
        // Relu à chaque fois (pas seulement au login) pour refléter sans délai
        // un changement de rôle par un Administrateur ou de nom d'affichage.
        const dbUser = await prisma.user.findUnique({ where: { id: token.userId as string } });
        if (dbUser) {
          session.user.siteRole = dbUser.siteRole;
          session.user.name = dbUser.displayName || dbUser.discordTag;
        }
      }
      return session;
    }
  }
};

// Petites aides réutilisées dans les pages/routes API pour vérifier les droits
export function canConfigureRaids(role?: SiteRole) {
  return role === "OFFICIER" || role === "ADMINISTRATEUR";
}
export function canManageRoles(role?: SiteRole) {
  return role === "ADMINISTRATEUR";
}
// Un compte CANDIDAT est connecté mais n'est pas (encore) membre de la
// guilde : à vérifier explicitement sur toute route qui n'était protégée
// que par "avoir une session", puisque n'importe quel compte Discord peut
// désormais se connecter (voir /candidature).
export function isMember(role?: SiteRole) {
  return role !== undefined && role !== "CANDIDAT";
}
