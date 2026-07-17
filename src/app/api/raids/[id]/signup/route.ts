import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST : un Raideur s'inscrit avec un de ses personnages
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json();
  const { characterId, comment } = body;

  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character || character.userId !== session.user.id) {
    return NextResponse.json({ error: "Ce personnage ne vous appartient pas" }, { status: 403 });
  }

  const raid = await prisma.raid.findUnique({ where: { id: params.id } });
  if (!raid) return NextResponse.json({ error: "Raid introuvable" }, { status: 404 });
  if (raid.status !== "OUVERT") {
    return NextResponse.json({ error: "Les inscriptions ne sont pas ouvertes pour ce raid" }, { status: 409 });
  }

  const signup = await prisma.raidSignup.upsert({
    where: { raidId_characterId: { raidId: params.id, characterId } },
    update: { status: "INSCRIT", comment: comment || null },
    create: { raidId: params.id, characterId, comment: comment || null, status: "INSCRIT" }
  });
  return NextResponse.json(signup, { status: 201 });
}

// DELETE : se désinscrire (le Raideur lui-même) ou retirer quelqu'un (Officier/Admin)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { characterId } = await req.json();
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character) return NextResponse.json({ error: "Personnage introuvable" }, { status: 404 });

  const isOwner = character.userId === session.user.id;
  if (!isOwner && !canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  await prisma.raidSignup.update({
    where: { raidId_characterId: { raidId: params.id, characterId } },
    data: { status: isOwner ? "DESISTE" : "ABSENT" }
  });
  return NextResponse.json({ ok: true });
}

// PATCH : un Officier/Admin change le statut d'un inscrit (ex: passer en réserve)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { characterId, status } = await req.json();
  const signup = await prisma.raidSignup.update({
    where: { raidId_characterId: { raidId: params.id, characterId } },
    data: { status }
  });
  return NextResponse.json(signup);
}
