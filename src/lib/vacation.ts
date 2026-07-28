import { prisma } from "./prisma";

// Mode vacances : inscrit automatiquement en ABSENT les personnes dont la
// période de vacances couvre un raid. Deux déclencheurs : la création
// d'un raid (voir autoAbsentForVacationingUsers, POST /api/raids) et la
// définition/modification de ses propres dates de vacances (voir
// autoAbsentForUserVacation, PATCH /api/me). Ponctuel : ne réenforce pas
// en continu, la personne peut toujours changer son statut manuellement
// après coup.

export async function autoAbsentForVacationingUsers(raidId: string, raidDate: Date) {
  const vacationingUsers = await prisma.user.findMany({
    where: { vacationStart: { lte: raidDate }, vacationEnd: { gte: raidDate } },
    select: { id: true }
  });
  if (vacationingUsers.length === 0) return;

  await prisma.$transaction(
    vacationingUsers.map((u) =>
      prisma.raidSignup.upsert({
        where: { raidId_userId: { raidId, userId: u.id } },
        update: { status: "ABSENT", characterId: null, slot: null },
        create: { raidId, userId: u.id, status: "ABSENT" }
      })
    )
  );
}

export async function autoAbsentForUserVacation(userId: string, start: Date, end: Date) {
  const now = new Date();
  const effectiveStart = start > now ? start : now;
  if (effectiveStart > end) return;

  const raids = await prisma.raid.findMany({
    where: { date: { gte: effectiveStart, lte: end }, status: { not: "ANNULE" } },
    select: { id: true }
  });
  if (raids.length === 0) return;

  await prisma.$transaction(
    raids.map((r) =>
      prisma.raidSignup.upsert({
        where: { raidId_userId: { raidId: r.id, userId } },
        update: { status: "ABSENT", characterId: null, slot: null },
        create: { raidId: r.id, userId, status: "ABSENT" }
      })
    )
  );
}
