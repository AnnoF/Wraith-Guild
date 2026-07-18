import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveRaidStatus } from "@/lib/raidStatus";

// GET : liste des raids. ?statut=OUVERT|FERME|TERMINE|ANNULE (optionnel)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut");

  const raids = await prisma.raid.findMany({
    where: statut ? { status: statut as any } : undefined,
    orderBy: { date: "asc" },
    include: {
      _count: { select: { signups: { where: { status: "INSCRIT" } } } }
    }
  });
  return NextResponse.json(raids.map((r) => ({ ...r, status: effectiveRaidStatus(r) })));
}

// POST : création d'un raid (Officier / Administrateur uniquement)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  const { title, date, size, signupDeadline, notes } = body;

  if (!title || !date || ![10, 20, 25, 40].includes(Number(size))) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const raid = await prisma.raid.create({
    data: {
      title,
      date: new Date(date),
      size: Number(size),
      signupDeadline: signupDeadline ? new Date(signupDeadline) : null,
      notes: notes || null,
      createdById: session.user.id
    }
  });
  return NextResponse.json(raid, { status: 201 });
}
