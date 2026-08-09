import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RecruitmentPriority } from "@prisma/client";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecruitmentStatus, RECRUITMENT_PRIORITIES } from "@/lib/recruitment";
import { WOW_CLASSES, type WowClass } from "@/lib/classes";

// GET : état du recrutement affiché sur la page vitrine — publique (accueil
// non connecté compris), donc pas de contrôle de session ici.
export async function GET() {
  const status = await getRecruitmentStatus();
  return NextResponse.json(status);
}

// PUT : remplace l'état du recrutement pour toutes les classes (Officier+).
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  const entries = body?.entries;
  if (!Array.isArray(entries) || entries.length !== WOW_CLASSES.length) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const seen = new Set<string>();
  for (const entry of entries) {
    if (
      !entry ||
      typeof entry.wowClass !== "string" ||
      typeof entry.priority !== "string" ||
      !WOW_CLASSES.includes(entry.wowClass as WowClass) ||
      !RECRUITMENT_PRIORITIES.includes(entry.priority as RecruitmentPriority) ||
      seen.has(entry.wowClass)
    ) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    seen.add(entry.wowClass);
  }
  if (seen.size !== WOW_CLASSES.length) {
    return NextResponse.json({ error: "Chaque classe doit être renseignée exactement une fois" }, { status: 400 });
  }

  await prisma.$transaction(
    (entries as { wowClass: WowClass; priority: RecruitmentPriority }[]).map((entry) =>
      prisma.recruitmentStatus.upsert({
        where: { wowClass: entry.wowClass },
        update: { priority: entry.priority },
        create: { wowClass: entry.wowClass, priority: entry.priority }
      })
    )
  );

  const status = await getRecruitmentStatus();
  return NextResponse.json(status);
}
