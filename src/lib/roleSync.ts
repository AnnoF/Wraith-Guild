import type { SiteRole } from "@prisma/client";
import type { DiscordRoleFlags } from "./discord";

// Résolution du rôle site dérivé des rôles Discord, par priorité
// décroissante Officier > Member > Social > Candidat. Utilisée à la
// création de compte (src/lib/auth.ts) ET par le job quotidien de
// resynchronisation (POST /api/cron/sync-roles) — jamais pour
// ADMINISTRATEUR (site uniquement) ni APPLY (décidé par un Officier sur
// une candidature, voir PATCH /api/applications/[id]).
export function resolveDiscordSiteRole(flags: DiscordRoleFlags): SiteRole {
  if (flags.isOfficier) return "OFFICIER";
  if (flags.isMember) return "MEMBER";
  if (flags.isSocial) return "SOCIAL";
  return "CANDIDAT";
}
