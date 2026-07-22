import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveRaidStatus } from "@/lib/raidStatus";
import { RAID_INSTANCES, RAID_INSTANCE_SIZES } from "@/lib/raidInstances";

// GET : liste des raids.
// ?statut=OUVERT|FERME|TERMINE|ANNULE (optionnel, filtre sur le statut brut)
// ?when=upcoming|past (optionnel, filtre sur la date/heure du raid — un
//   raid reste "à venir" tant que sa date n'est pas passée, même si les
//   inscriptions sont fermées entre-temps)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut");
  const when = searchParams.get("when");

  const raids = await prisma.raid.findMany({
    where: {
      status: statut ? (statut as any) : undefined,
      date: when === "upcoming" ? { gte: new Date() } : when === "past" ? { lt: new Date() } : undefined
    },
    orderBy: { date: when === "past" ? "desc" : "asc" },
    include: {
      _count: { select: { signups: { where: { status: "INSCRIT" } } } }
    }
  });
  return NextResponse.json(raids.map((r) => ({ ...r, status: effectiveRaidStatus(r) })));
}

// POST : création d'un ou plusieurs raids (Officier / Administrateur
// uniquement). Plusieurs instances peuvent être sélectionnées en une
// seule fois (même date/date limite/notes), pratique pour planifier
// plusieurs raids d'un coup.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  const { titles, date, signupDeadline, notes } = body;

  if (!Array.isArray(titles) || titles.length === 0 || !date) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }
  if (titles.some((title: string) => !RAID_INSTANCES.includes(title))) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  // La taille est fixée par l'instance, jamais par le client, pour éviter
  // toute incohérence (voir RAID_INSTANCE_SIZES).
  const raids = await prisma.$transaction(
    titles.map((title: string) =>
      prisma.raid.create({
        data: {
          title,
          date: new Date(date),
          size: RAID_INSTANCE_SIZES[title],
          signupDeadline: signupDeadline ? new Date(signupDeadline) : null,
          notes: notes || null,
          createdById: session.user.id
        }
      })
    )
  );
  return NextResponse.json(raids, { status: 201 });
}
