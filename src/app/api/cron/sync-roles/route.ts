import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchGuildMember, fetchDiscordRoleFlags } from "@/lib/discord";
import { resolveDiscordSiteRole } from "@/lib/roleSync";
import type { SiteRole } from "@prisma/client";

// Rôles dont l'origine est Discord et que ce job peut donc corriger :
// OFFICIER/MEMBER/SOCIAL suivent le rôle Discord le plus élevé détecté, et
// CANDIDAT est réévalué au cas où la personne aurait rejoint la guilde
// depuis. ADMINISTRATEUR (site uniquement) et APPLY (décidé par un
// Officier sur une candidature, voir PATCH /api/applications/[id]) ne sont
// jamais modifiés ici.
const DISCORD_MANAGED_ROLES: SiteRole[] = ["CANDIDAT", "OFFICIER", "MEMBER", "SOCIAL"];

// POST : resynchronise le rôle site de chaque compte concerné avec ses
// rôles Discord actuels. Appelé une fois par jour par
// .github/workflows/sync-roles.yml, protégé par un secret partagé
// (CRON_SECRET) plutôt que par une session — ce n'est pas un humain qui
// appelle cette route.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { siteRole: { in: DISCORD_MANAGED_ROLES } },
    select: { id: true, discordId: true, siteRole: true }
  });

  let updated = 0;
  let failed = 0;

  for (const user of users) {
    try {
      const member = await fetchGuildMember(user.discordId);
      const flags = await fetchDiscordRoleFlags(member);
      const newRole = resolveDiscordSiteRole(flags);
      if (newRole !== user.siteRole) {
        await prisma.$transaction([
          prisma.user.update({ where: { id: user.id }, data: { siteRole: newRole } }),
          prisma.roleAudit.create({
            data: { targetUserId: user.id, previousRole: user.siteRole, newRole }
          })
        ]);
        updated++;
      }
    } catch (err) {
      failed++;
      console.error(`Erreur resynchronisation rôle Discord (utilisateur ${user.id}) :`, err);
    }
    // Petite pause entre chaque membre pour rester sous les limites de
    // rate-limit de l'API Discord (fetchGuildMember + getRoleIdByName).
    await new Promise((r) => setTimeout(r, 250));
  }

  return NextResponse.json({ checked: users.length, updated, failed });
}
