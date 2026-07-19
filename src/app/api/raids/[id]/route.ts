import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveRaidStatus } from "@/lib/raidStatus";
import { getWowWeekRange } from "@/lib/wowWeek";

// GET : détail d'un raid + inscriptions (avec personnage et propriétaire)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const raid = await prisma.raid.findUnique({
    where: { id: params.id },
    include: {
      signups: {
        include: {
          user: {
            include: {
              characters: { where: { isActive: true }, include: { professions: true } }
            }
          },
          character: { include: { professions: true } }
        },
        orderBy: { createdAt: "asc" }
      },
      bossRoleAssignments: {
        include: { character: { include: { professions: true } } }
      },
      createdBy: true
    }
  });
  if (!raid) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Personnages déjà engagés sur un raid de même titre cette semaine WoW
  // (mercredi -> mardi) — affiché en puce "interdit" côté composition
  // pour éviter un aller-retour inutile en glisser-déposer.
  const { start, end } = getWowWeekRange(raid.date);
  const conflictingSignups = await prisma.raidSignup.findMany({
    where: {
      status: "INSCRIT",
      slot: { not: null },
      raidId: { not: params.id },
      raid: { title: raid.title, date: { gte: start, lte: end } }
    },
    select: { characterId: true }
  });
  const lockedCharacterIds = new Set(
    conflictingSignups.map((s) => s.characterId).filter((cid): cid is string => !!cid)
  );

  return NextResponse.json({
    ...raid,
    status: effectiveRaidStatus(raid),
    signups: raid.signups.map((s) => ({
      ...s,
      user: {
        ...s.user,
        discordTag: s.user.displayName || s.user.discordTag,
        characters: s.user.characters.map((c) => ({ ...c, weekLocked: lockedCharacterIds.has(c.id) }))
      }
    }))
  });
}

// PATCH : modifier statut/infos du raid (Officier/Admin)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  const raid = await prisma.raid.update({
    where: { id: params.id },
    data: {
      title: body.title ?? undefined,
      date: body.date ? new Date(body.date) : undefined,
      size: body.size ?? undefined,
      signupDeadline: body.signupDeadline !== undefined ? (body.signupDeadline ? new Date(body.signupDeadline) : null) : undefined,
      notes: body.notes ?? undefined,
      status: body.status ?? undefined
    }
  });
  return NextResponse.json(raid);
}
