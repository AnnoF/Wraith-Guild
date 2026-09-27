import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids, isMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveRaidStatus } from "@/lib/raidStatus";
import { getWowWeekRange } from "@/lib/wowWeek";

// POST : un Raideur s'inscrit lui-même (disponibilité pour toute la
// soirée), sans choisir de personnage — c'est un Officier qui placera un
// personnage dans une phase précise ensuite (voir PATCH ci-dessous). Peut
// aussi se signaler absent (status: "ABSENT") pour prévenir sans se
// désinscrire complètement (DESISTE) — reste visible, grisé, en
// composition, contrairement à un désistement.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!isMember(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const comment = typeof body.comment === "string" ? body.comment.trim() || null : null;
  const status = body.status === "ABSENT" ? "ABSENT" : "INSCRIT";

  const raid = await prisma.raid.findUnique({ where: { id } });
  if (!raid) return NextResponse.json({ error: "Raid introuvable" }, { status: 404 });
  // Se signaler absent reste possible même après la fermeture des
  // inscriptions (utile en dernière minute) ; s'inscrire non.
  if (status === "INSCRIT" && effectiveRaidStatus(raid) !== "OUVERT") {
    return NextResponse.json({ error: "Les inscriptions ne sont pas ouvertes pour ce raid" }, { status: 409 });
  }

  const signup = await prisma.raidSignup.upsert({
    where: { raidId_userId: { raidId: id, userId: session.user.id } },
    update: { status, comment },
    create: { raidId: id, userId: session.user.id, comment, status }
  });
  // Se signaler absent libère les places qu'on occupait éventuellement,
  // dans chaque phase où on avait été placé.
  if (status === "ABSENT") {
    await prisma.raidPlacement.deleteMany({ where: { signupId: signup.id } });
  }
  return NextResponse.json(signup, { status: 201 });
}

// DELETE : se désinscrire (le Raideur lui-même) ou retirer quelqu'un (Officier/Admin)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetUserId = body.userId || session.user.id;

  const isOwner = targetUserId === session.user.id;
  if (!isMember(session.user.siteRole) || (!isOwner && !canConfigureRaids(session.user.siteRole))) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const signup = await prisma.raidSignup.update({
    where: { raidId_userId: { raidId: id, userId: targetUserId } },
    data: { status: isOwner ? "DESISTE" : "ABSENT" }
  });
  await prisma.raidPlacement.deleteMany({ where: { signupId: signup.id } });
  return NextResponse.json({ ok: true });
}

// PATCH : un Officier/Admin change le statut d'une inscription, et/ou
// place (glisser-déposer) un personnage dans une instance précise d'une
// phase. Déplacer un personnage sur un slot déjà occupé de la même
// instance libère l'ancien occupant de ce slot. Un même joueur ne peut
// être placé que dans une seule instance par phase (celles-ci se
// déroulant en même temps).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { userId, status, characterId, runId, slot } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

  const signup = await prisma.raidSignup.findUnique({
    where: { raidId_userId: { raidId: id, userId } }
  });
  if (!signup) return NextResponse.json({ error: "Inscription introuvable" }, { status: 404 });

  if (status) {
    await prisma.raidSignup.update({ where: { id: signup.id }, data: { status } });
    // Mettre en réserve, se désister ou se déclarer absent retire des
    // grilles de toutes les phases où le joueur était placé.
    if (status !== "INSCRIT") {
      await prisma.raidPlacement.deleteMany({ where: { signupId: signup.id } });
    }
  }

  if (runId && slot === null) {
    await prisma.raidPlacement.deleteMany({ where: { signupId: signup.id, runId } });
  } else if (runId && typeof slot === "number" && characterId) {
    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character || character.userId !== userId || !character.isActive) {
      return NextResponse.json(
        { error: "Ce personnage n'appartient pas à ce joueur ou est archivé" },
        { status: 400 }
      );
    }

    const run = await prisma.raidRun.findUnique({ where: { id: runId }, include: { phase: true } });
    if (!run || run.phase.raidId !== id) {
      return NextResponse.json({ error: "Instance introuvable" }, { status: 404 });
    }

    // Un personnage ne peut pas être placé deux fois sur la même instance
    // (même titre) au sein de la même semaine WoW (mercredi -> mardi).
    const raid = await prisma.raid.findUnique({ where: { id } });
    if (!raid) return NextResponse.json({ error: "Raid introuvable" }, { status: 404 });
    const { start, end } = getWowWeekRange(raid.date);
    const weekConflict = await prisma.raidPlacement.findFirst({
      where: {
        characterId,
        runId: { not: runId },
        run: { title: run.title, phase: { raidId: { not: id }, raid: { date: { gte: start, lte: end } } } }
      },
      include: { run: { include: { phase: { include: { raid: true } } } } }
    });
    if (weekConflict) {
      return NextResponse.json(
        {
          error: `Ce personnage est déjà engagé sur ${run.title} cette semaine (${new Date(
            weekConflict.run.phase.raid.date
          ).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })})`
        },
        { status: 409 }
      );
    }

    // Deux instances d'une même phase se déroulent en même temps : un
    // joueur ne peut être placé que dans une seule d'entre elles.
    const samePhaseConflict = await prisma.raidPlacement.findFirst({
      where: { signupId: signup.id, runId: { not: runId }, run: { phaseId: run.phaseId } }
    });
    if (samePhaseConflict) {
      return NextResponse.json(
        { error: "Ce joueur est déjà placé dans l'autre instance de cette phase (elles se déroulent en même temps)" },
        { status: 409 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const mover = await tx.raidPlacement.findUnique({
        where: { signupId_runId: { signupId: signup.id, runId } }
      });
      const originSlot = mover?.slot ?? null;

      // Celui qui occupait déjà le slot cible récupère l'ancien slot du
      // joueur déplacé (échange), ou est retiré de la grille s'il n'y en avait pas.
      const occupant = await tx.raidPlacement.findUnique({ where: { runId_slot: { runId, slot } } });
      if (occupant && occupant.signupId !== signup.id) {
        if (originSlot !== null) {
          await tx.raidPlacement.update({ where: { id: occupant.id }, data: { slot: originSlot } });
        } else {
          await tx.raidPlacement.delete({ where: { id: occupant.id } });
        }
      }

      await tx.raidPlacement.upsert({
        where: { signupId_runId: { signupId: signup.id, runId } },
        update: { slot, characterId },
        create: { signupId: signup.id, runId, slot, characterId }
      });
    });
  }

  const updated = await prisma.raidSignup.findUnique({
    where: { id: signup.id },
    include: { placements: true }
  });
  return NextResponse.json(updated);
}
