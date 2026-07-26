import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WOW_CLASSES, CLASS_LABELS, CLASS_SPECS } from "@/lib/classes";
import { PROFESSIONS } from "@/lib/professions";
import { APPLICATION_WEEKDAYS, isApplicationActive } from "@/lib/applicationInfo";
import { notifyNewApplication } from "@/lib/discordWebhook";
import { fetchGuildMember } from "@/lib/discord";

// GET : liste des candidatures (tout connecté sauf CANDIDAT).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (session.user.siteRole === "CANDIDAT") {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { discordTag: true, displayName: true } } }
  });
  return NextResponse.json(applications);
}

// POST : dépose une candidature (tout compte connecté, un seul actif par compte).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  // Il faut avoir rejoint le Discord de guilde pour pouvoir postuler, sinon
  // le bot ne pourrait pas transmettre les réponses des officiers en DM
  // (voir POST /api/applications/[id]/comments). Vérifié aussi côté
  // formulaire (GET /api/applications/me), mais on ne fait jamais confiance
  // au seul client.
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { discordId: true }
  });
  let isGuildMember = false;
  try {
    const member = dbUser ? await fetchGuildMember(dbUser.discordId) : null;
    isGuildMember = !!member;
  } catch (err) {
    console.error("Erreur de vérification Discord (candidature) :", err);
  }
  if (!isGuildMember) {
    return NextResponse.json(
      { error: "Vous devez d'abord rejoindre notre Discord avant de pouvoir postuler." },
      { status: 403 }
    );
  }

  const latest = await prisma.application.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" }
  });
  if (latest && isApplicationActive(latest)) {
    return NextResponse.json({ error: "Vous avez déjà une candidature en cours" }, { status: 409 });
  }

  const body = await req.json();
  const {
    discordTag,
    characterName,
    wowClass,
    spec,
    race,
    level,
    professions,
    addons,
    uiScreenshotUrl,
    experience,
    goals,
    pvpGoals,
    nightsPerWeek,
    availableNights,
    discoverySource,
    knownMembers,
    extra
  } = body;

  if (
    !discordTag ||
    !characterName ||
    !WOW_CLASSES.includes(wowClass) ||
    !CLASS_SPECS[wowClass as keyof typeof CLASS_SPECS]?.includes(spec) ||
    !race ||
    !level ||
    !Array.isArray(professions) ||
    professions.some((p: string) => !PROFESSIONS.includes(p as any)) ||
    !addons ||
    !uiScreenshotUrl ||
    !experience ||
    !goals ||
    !pvpGoals ||
    typeof nightsPerWeek !== "number" ||
    nightsPerWeek < 1 ||
    nightsPerWeek > 7 ||
    !Array.isArray(availableNights) ||
    availableNights.length === 0 ||
    availableNights.some((d: string) => !APPLICATION_WEEKDAYS.includes(d)) ||
    !discoverySource ||
    !knownMembers
  ) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const application = await prisma.application.create({
    data: {
      userId: session.user.id,
      discordTag,
      characterName,
      wowClass,
      spec,
      race,
      level,
      professions,
      addons,
      uiScreenshotUrl,
      experience,
      goals,
      pvpGoals,
      nightsPerWeek,
      availableNights,
      discoverySource,
      knownMembers,
      extra: extra || null
    }
  });
  await notifyNewApplication({
    id: application.id,
    characterName: application.characterName,
    discordTag: application.discordTag,
    classLabel: CLASS_LABELS[application.wowClass],
    spec: application.spec
  });
  return NextResponse.json(application, { status: 201 });
}
