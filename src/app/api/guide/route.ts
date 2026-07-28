import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids, isMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RAID_INSTANCES } from "@/lib/raidInstances";
import { isSafeHttpUrl } from "@/lib/url";

// GET : liste des entrées de guide (tout membre connecté, pas les CANDIDAT).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!isMember(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const entries = await prisma.guideEntry.findMany({
    orderBy: [{ raidTitle: "asc" }, { order: "asc" }, { createdAt: "asc" }]
  });
  return NextResponse.json(entries);
}

// POST : ajoute une entrée de guide (Officier/Administrateur uniquement).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { raidTitle, bossName, videoUrl, notes } = await req.json();
  if (!RAID_INSTANCES.includes(raidTitle) || !bossName || typeof bossName !== "string" || !bossName.trim()) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }
  if (videoUrl && !isSafeHttpUrl(videoUrl)) {
    return NextResponse.json({ error: "Lien vidéo invalide" }, { status: 400 });
  }

  const last = await prisma.guideEntry.findFirst({
    where: { raidTitle },
    orderBy: { order: "desc" },
    select: { order: true }
  });

  const entry = await prisma.guideEntry.create({
    data: {
      raidTitle,
      bossName: bossName.trim(),
      videoUrl: videoUrl || null,
      notes: notes || null,
      order: (last?.order ?? -1) + 1
    }
  });
  return NextResponse.json(entry, { status: 201 });
}
