import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RAID_BOSS_ROLES } from "@/lib/bossRoles";

// PATCH : assigne (ou retire) un personnage à un rôle spécifique à un
// boss, dans le "mode avancé" de la composition d'une instance (RaidRun).
// Le personnage doit déjà être placé dans la grille de cette instance
// (RaidPlacement).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { runId, boss, role, characterId } = await req.json();
  if (!runId || !boss || !role) {
    return NextResponse.json({ error: "runId/boss/role manquant" }, { status: 400 });
  }

  const run = await prisma.raidRun.findUnique({ where: { id: runId }, include: { phase: true } });
  if (!run || run.phase.raidId !== id) {
    return NextResponse.json({ error: "Instance introuvable" }, { status: 404 });
  }

  const template = RAID_BOSS_ROLES[run.title] ?? [];
  const bossEntry = template.find((b) => b.boss === boss);
  if (!bossEntry || !bossEntry.roles.some((r) => r.label === role)) {
    return NextResponse.json({ error: "Rôle inconnu pour cette instance" }, { status: 400 });
  }

  if (characterId) {
    const placement = await prisma.raidPlacement.findFirst({ where: { runId, characterId } });
    if (!placement) {
      return NextResponse.json(
        { error: "Ce personnage doit d'abord être placé dans un groupe de cette instance" },
        { status: 400 }
      );
    }
  }

  const assignment = await prisma.bossRoleAssignment.upsert({
    where: { runId_boss_role: { runId, boss, role } },
    update: { characterId: characterId || null },
    create: { runId, boss, role, characterId: characterId || null }
  });
  return NextResponse.json(assignment);
}
