import type { SiteRole } from "@prisma/client";
import type { DiscordRoleFlags } from "./discord";

// Résolution du rôle site dérivé des rôles Discord, par priorité
// décroissante Officier > Member > Apply > Social > Candidat (reprend
// l'ordre "Member > Apply > Casual/Social" déjà documenté dans
// src/lib/applicationInfo.ts pour l'attribution des places en raid).
// Utilisée à la création de compte (src/lib/auth.ts) ET par le job
// quotidien de resynchronisation (POST /api/cron/sync-roles) — jamais pour
// ADMINISTRATEUR (site uniquement). Le rôle Discord Apply n'est jamais posé
// par le site (voir PATCH /api/applications/[id], qui bascule le rang site
// immédiatement sans attendre le job) : il est assigné à la main par un
// Officier, et simplement lu ici pour que le job quotidien le maintienne.
export function resolveDiscordSiteRole(flags: DiscordRoleFlags): SiteRole {
  if (flags.isOfficier) return "OFFICIER";
  if (flags.isMember) return "MEMBER";
  if (flags.isApply) return "APPLY";
  if (flags.isSocial) return "SOCIAL";
  return "CANDIDAT";
}
