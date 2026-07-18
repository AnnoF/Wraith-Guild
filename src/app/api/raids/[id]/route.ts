import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveRaidStatus } from "@/lib/raidStatus";

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
      createdBy: true
    }
  });
  if (!raid) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({
    ...raid,
    status: effectiveRaidStatus(raid),
    signups: raid.signups.map((s) => ({
      ...s,
      user: { ...s.user, discordTag: s.user.displayName || s.user.discordTag }
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
