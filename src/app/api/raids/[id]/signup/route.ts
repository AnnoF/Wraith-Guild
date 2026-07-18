import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveRaidStatus } from "@/lib/raidStatus";
import { getWowWeekRange } from "@/lib/wowWeek";

// POST : un Raideur s'inscrit lui-même (disponibilité), sans choisir de
// personnage — c'est un Officier qui assignera un personnage ensuite
// (voir PATCH ci-dessous).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const comment = typeof body.comment === "string" ? body.comment.trim() || null : null;

  const raid = await prisma.raid.findUnique({ where: { id: params.id } });
  if (!raid) return NextResponse.json({ error: "Raid introuvable" }, { status: 404 });
  if (effectiveRaidStatus(raid) !== "OUVERT") {
    return NextResponse.json({ error: "Les inscriptions ne sont pas ouvertes pour ce raid" }, { status: 409 });
  }

  const signup = await prisma.raidSignup.upsert({
    where: { raidId_userId: { raidId: params.id, userId: session.user.id } },
    update: { status: "INSCRIT", comment },
    create: { raidId: params.id, userId: session.user.id, comment, status: "INSCRIT" }
  });
  return NextResponse.json(signup, { status: 201 });
}

// DELETE : se désinscrire (le Raideur lui-même) ou retirer quelqu'un (Officier/Admin)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const targetUserId = body.userId || session.user.id;

  const isOwner = targetUserId === session.user.id;
  if (!isOwner && !canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  await prisma.raidSignup.update({
    where: { raidId_userId: { raidId: params.id, userId: targetUserId } },
    data: { status: isOwner ? "DESISTE" : "ABSENT" }
  });
  return NextResponse.json({ ok: true });
}

// PATCH : un Officier/Admin assigne un personnage et/ou une position dans
// la grille de composition (drag & drop). Déplacer un personnage sur un
// slot déjà occupé libère l'ancien occupant de ce slot.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { userId, status, characterId, slot } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

  if (characterId) {
    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character || character.userId !== userId || !character.isActive) {
      return NextResponse.json(
        { error: "Ce personnage n'appartient pas à ce joueur ou est archivé" },
        { status: 400 }
      );
    }

    // Un personnage ne peut pas être placé deux fois sur le même raid
    // (même titre) au sein de la même semaine WoW (mercredi -> mardi).
    if (typeof slot === "number") {
      const raid = await prisma.raid.findUnique({ where: { id: params.id } });
      if (!raid) return NextResponse.json({ error: "Raid introuvable" }, { status: 404 });

      const { start, end } = getWowWeekRange(raid.date);
      const conflict = await prisma.raidSignup.findFirst({
        where: {
          characterId,
          status: "INSCRIT",
          slot: { not: null },
          raidId: { not: params.id },
          raid: { title: raid.title, date: { gte: start, lte: end } }
        },
        include: { raid: true }
      });
      if (conflict) {
        return NextResponse.json(
          {
            error: `Ce personnage est déjà engagé sur ${raid.title} cette semaine (${new Date(
              conflict.raid.date
            ).toLocaleDateString("fr-FR")})`
          },
          { status: 409 }
        );
      }
    }
  }

  const signup = await prisma.$transaction(async (tx) => {
    if (typeof slot === "number") {
      const mover = await tx.raidSignup.findUnique({
        where: { raidId_userId: { raidId: params.id, userId } },
        select: { slot: true }
      });
      const originSlot = mover?.slot ?? null;

      // Vide d'abord le slot d'origine du joueur déplacé pour éviter un
      // conflit avec la contrainte d'unicité (raidId, slot) pendant l'échange.
      await tx.raidSignup.updateMany({
        where: { raidId: params.id, userId },
        data: { slot: null }
      });
      // Celui qui occupait déjà le slot cible récupère l'ancien slot du
      // joueur déplacé (échange), ou redevient non placé s'il n'y en avait pas.
      await tx.raidSignup.updateMany({
        where: { raidId: params.id, slot, userId: { not: userId } },
        data: { slot: originSlot }
      });
    }
    return tx.raidSignup.update({
      where: { raidId_userId: { raidId: params.id, userId } },
      data: {
        status: status ?? undefined,
        characterId: characterId === undefined ? undefined : characterId || null,
        slot: slot === undefined ? undefined : slot
      }
    });
  });
  return NextResponse.json(signup);
}
