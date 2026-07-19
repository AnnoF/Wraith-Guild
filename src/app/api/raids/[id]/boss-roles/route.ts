import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RAID_BOSS_ROLES } from "@/lib/bossRoles";

// PATCH : assigne (ou retire) un personnage à un rôle spécifique à un
// boss, dans le "mode avancé" de la composition. Le personnage doit
// déjà être placé dans la grille du raid (RaidSignup.slot renseigné).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { boss, role, characterId } = await req.json();
  if (!boss || !role) {
    return NextResponse.json({ error: "boss/role manquant" }, { status: 400 });
  }

  const raid = await prisma.raid.findUnique({ where: { id: params.id } });
  if (!raid) return NextResponse.json({ error: "Raid introuvable" }, { status: 404 });

  const template = RAID_BOSS_ROLES[raid.title];
  const bossEntry = template?.find((b) => b.boss === boss);
  if (!bossEntry || !bossEntry.roles.some((r) => r.label === role)) {
    return NextResponse.json({ error: "Rôle inconnu pour ce raid" }, { status: 400 });
  }

  if (characterId) {
    const placement = await prisma.raidSignup.findFirst({
      where: { raidId: params.id, characterId, status: "INSCRIT", slot: { not: null } }
    });
    if (!placement) {
      return NextResponse.json(
        { error: "Ce personnage doit d'abord être placé dans un groupe du raid" },
        { status: 400 }
      );
    }
  }

  const assignment = await prisma.bossRoleAssignment.upsert({
    where: { raidId_boss_role: { raidId: params.id, boss, role } },
    update: { characterId: characterId || null },
    create: { raidId: params.id, boss, role, characterId: characterId || null }
  });
  return NextResponse.json(assignment);
}
