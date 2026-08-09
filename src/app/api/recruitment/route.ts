import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RecruitmentPriority } from "@prisma/client";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { allSpecs, getRecruitmentStatus, RECRUITMENT_PRIORITIES, specKey } from "@/lib/recruitment";
import { WOW_CLASSES, type WowClass } from "@/lib/classes";

// GET : état du recrutement affiché sur la page vitrine — publique (accueil
// non connecté compris), donc pas de contrôle de session ici.
export async function GET() {
  const status = await getRecruitmentStatus();
  return NextResponse.json(status);
}

// PUT : remplace l'état du recrutement pour toutes les spés (Officier+).
export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  const entries = body?.entries;
  const specs = allSpecs();
  if (!Array.isArray(entries) || entries.length !== specs.length) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const validKeys = new Set(specs.map(({ wowClass, spec }) => specKey(wowClass, spec)));
  const seen = new Set<string>();
  for (const entry of entries) {
    if (
      !entry ||
      typeof entry.wowClass !== "string" ||
      typeof entry.spec !== "string" ||
      typeof entry.priority !== "string" ||
      !WOW_CLASSES.includes(entry.wowClass as WowClass) ||
      !validKeys.has(specKey(entry.wowClass, entry.spec)) ||
      !RECRUITMENT_PRIORITIES.includes(entry.priority as RecruitmentPriority)
    ) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    const key = specKey(entry.wowClass, entry.spec);
    if (seen.has(key)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }
    seen.add(key);
  }
  if (seen.size !== specs.length) {
    return NextResponse.json({ error: "Chaque spécialisation doit être renseignée exactement une fois" }, { status: 400 });
  }

  await prisma.$transaction(
    (entries as { wowClass: WowClass; spec: string; priority: RecruitmentPriority }[]).map((entry) =>
      prisma.recruitmentStatus.upsert({
        where: { wowClass_spec: { wowClass: entry.wowClass, spec: entry.spec } },
        update: { priority: entry.priority },
        create: { wowClass: entry.wowClass, spec: entry.spec, priority: entry.priority }
      })
    )
  );

  const status = await getRecruitmentStatus();
  return NextResponse.json(status);
}
