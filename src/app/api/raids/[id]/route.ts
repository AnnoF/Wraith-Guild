import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids, isMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveRaidStatus } from "@/lib/raidStatus";
import { getWowWeekRange } from "@/lib/wowWeek";
import { notifyRaidLocked } from "@/lib/raidNotify";

// GET : détail d'un raid — son déroulement (phases -> runs -> placements)
// et ses inscriptions (disponibilité globale de la soirée).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!isMember(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const raid = await prisma.raid.findUnique({
    where: { id },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: {
          runs: {
            orderBy: { order: "asc" },
            include: {
              placements: {
                include: { character: { include: { professions: true } } }
              },
              bossRoleAssignments: {
                include: { character: { include: { professions: true } } }
              }
            }
          }
        }
      },
      signups: {
        include: {
          user: {
            include: {
              characters: { where: { isActive: true }, include: { professions: true } }
            }
          }
        },
        orderBy: { createdAt: "asc" }
      },
      createdBy: true
    }
  });
  if (!raid) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Personnages déjà engagés sur une instance de même titre cette semaine
  // WoW (mercredi -> mardi) — affiché en puce "interdit" côté composition
  // pour éviter un aller-retour inutile en glisser-déposer.
  const titles = Array.from(new Set(raid.phases.flatMap((p) => p.runs.map((r) => r.title))));
  const { start, end } = getWowWeekRange(raid.date);
  const conflictingPlacements = titles.length
    ? await prisma.raidPlacement.findMany({
        where: {
          run: {
            title: { in: titles },
            phase: { raidId: { not: id }, raid: { date: { gte: start, lte: end } } }
          }
        },
        select: { characterId: true }
      })
    : [];
  const lockedCharacterIds = new Set(conflictingPlacements.map((p) => p.characterId));

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

// PATCH : modifier statut/infos de l'événement (Officier/Admin)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();

  const existing = await prisma.raid.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const raid = await prisma.raid.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      date: body.date ? new Date(body.date) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      signupDeadline: body.signupDeadline !== undefined ? (body.signupDeadline ? new Date(body.signupDeadline) : null) : undefined,
      notes: body.notes ?? undefined,
      status: body.status ?? undefined
    }
  });

  // "Verrouiller" = fermer les inscriptions : alerte Discord au moment où
  // ça passe effectivement à FERME (pas de re-notification si déjà FERME).
  if (body.status === "FERME" && existing.status !== "FERME") {
    await notifyRaidLocked(raid);
    // La composition est considérée terminée : tout inscrit encore
    // disponible mais jamais placé dans aucune phase passe
    // automatiquement en réserve (bench), qu'il l'ait souhaité ou non à
    // l'inscription — voir POST /api/raids/[id]/signup pour la
    // préférence `wantsBench`, qui elle ne fait jamais ce basculement
    // toute seule.
    await prisma.raidSignup.updateMany({
      where: { raidId: id, status: "INSCRIT", placements: { none: {} } },
      data: { status: "RESERVE" }
    });
  }

  return NextResponse.json(raid);
}
