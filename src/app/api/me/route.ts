import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { autoAbsentForUserVacation } from "@/lib/vacation";

// GET : profil du compte connecté (nom d'affichage, mode vacances).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, discordTag: true, vacationStart: true, vacationEnd: true }
  });
  return NextResponse.json(user);
}

// PATCH : définit (ou efface) le nom d'affichage et/ou les dates de mode
// vacances de l'utilisateur connecté. Vide -> revient au pseudo Discord
// (displayName) ou désactive le mode vacances (vacationStart/End).
// Définir des dates de vacances inscrit automatiquement en ABSENT tous les
// raids à venir dans cette période (voir lib/vacation.ts) — ponctuel, pas
// réappliqué en continu ensuite.
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.displayName !== undefined) {
    const trimmed = typeof body.displayName === "string" ? body.displayName.trim() : "";
    if (trimmed.length > 32) {
      return NextResponse.json({ error: "32 caractères maximum" }, { status: 400 });
    }
    data.displayName = trimmed || null;
  }

  let vacationStart: Date | null | undefined;
  let vacationEnd: Date | null | undefined;
  if (body.vacationStart !== undefined || body.vacationEnd !== undefined) {
    vacationStart = body.vacationStart ? new Date(body.vacationStart) : null;
    vacationEnd = body.vacationEnd ? new Date(body.vacationEnd) : null;
    if ((vacationStart && isNaN(vacationStart.getTime())) || (vacationEnd && isNaN(vacationEnd.getTime()))) {
      return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
    }
    if (vacationStart && vacationEnd && vacationStart > vacationEnd) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
    }
    data.vacationStart = vacationStart;
    data.vacationEnd = vacationEnd;
  }

  const updated = await prisma.user.update({ where: { id: session.user.id }, data });

  if (vacationStart && vacationEnd) {
    await autoAbsentForUserVacation(session.user.id, vacationStart, vacationEnd);
  }

  return NextResponse.json({
    displayName: updated.displayName,
    discordTag: updated.discordTag,
    vacationStart: updated.vacationStart,
    vacationEnd: updated.vacationEnd
  });
}
