import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET : liste des membres de la guilde (Raideur/Officier/Administrateur,
// pas les CANDIDAT qui sont gérés via /candidatures) avec leurs
// personnages, actifs et archivés. Réservé aux Officiers/Administrateurs.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const members = await prisma.user.findMany({
    where: { siteRole: { not: "CANDIDAT" } },
    orderBy: [{ isArchived: "asc" }, { discordTag: "asc" }],
    select: {
      id: true,
      discordTag: true,
      displayName: true,
      siteRole: true,
      isArchived: true,
      characters: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, class: true, spec: true, isActive: true, canRaidLead: true }
      }
    }
  });
  return NextResponse.json(members);
}
