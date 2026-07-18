import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  if (raid.status !== "OUVERT") {
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

// PATCH : un Officier/Admin change le statut d'un inscrit (réserve/inscrit)
// et/ou lui assigne un des personnages du joueur pour la composition.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { userId, status, characterId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId manquant" }, { status: 400 });

  if (characterId) {
    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character || character.userId !== userId || !character.isActive) {
      return NextResponse.json(
        { error: "Ce personnage n'appartient pas à ce joueur ou est archivé" },
        { status: 400 }
      );
    }
  }

  const signup = await prisma.raidSignup.update({
    where: { raidId_userId: { raidId: params.id, userId } },
    data: {
      status: status ?? undefined,
      characterId: characterId === undefined ? undefined : characterId || null
    }
  });
  return NextResponse.json(signup);
}
