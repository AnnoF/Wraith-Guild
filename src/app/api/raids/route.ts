import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids, isMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { effectiveRaidStatus } from "@/lib/raidStatus";
import { RAID_INSTANCES, RAID_INSTANCE_SIZES, instancesShareSize } from "@/lib/raidInstances";
import { autoAbsentForVacationingUsers } from "@/lib/vacation";

// GET : liste des raids.
// ?statut=OUVERT|FERME|TERMINE|ANNULE (optionnel, filtre sur le statut brut)
// ?when=upcoming|past (optionnel, filtre sur la date/heure du raid — un
//   raid reste "à venir" tant que sa soirée n'est pas terminée, même si
//   les inscriptions sont fermées entre-temps)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!isMember(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statut = searchParams.get("statut");
  const when = searchParams.get("when");

  const raids = await prisma.raid.findMany({
    where: {
      status: statut ? (statut as any) : undefined,
      endTime: when === "upcoming" ? { gte: new Date() } : when === "past" ? { lt: new Date() } : undefined
    },
    orderBy: { date: when === "past" ? "desc" : "asc" },
    include: {
      phases: {
        orderBy: { order: "asc" },
        include: { runs: { orderBy: { order: "asc" } } }
      },
      _count: { select: { signups: { where: { status: "INSCRIT" } } } }
    }
  });
  return NextResponse.json(raids.map((r) => ({ ...r, status: effectiveRaidStatus(r) })));
}

// POST : création d'un événement de raid (Officier / Administrateur
// uniquement). Une soirée se découpe en phases successives (`phases`,
// dans l'ordre du tableau) ; chaque phase peut programmer une ou
// plusieurs instances concurrentes, à condition qu'elles partagent la
// même taille (la guilde ne mélange jamais deux tailles en même temps).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  const { name, date, endTime, signupDeadline, notes, recurrenceCount, phases } = body;

  if (typeof name !== "string" || !name.trim() || !date || !endTime) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }
  if (new Date(endTime) <= new Date(date)) {
    return NextResponse.json({ error: "L'heure de fin doit être après l'heure de début" }, { status: 400 });
  }
  if (!Array.isArray(phases) || phases.length === 0) {
    return NextResponse.json({ error: "Programmez au moins une phase" }, { status: 400 });
  }
  for (const phase of phases) {
    const titles = phase?.titles;
    if (!Array.isArray(titles) || titles.length === 0) {
      return NextResponse.json({ error: "Chaque phase doit contenir au moins une instance" }, { status: 400 });
    }
    if (titles.some((title: string) => !RAID_INSTANCES.includes(title))) {
      return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
    }
    if (!instancesShareSize(titles)) {
      return NextResponse.json(
        { error: "Les instances d'une même phase doivent toutes avoir la même taille" },
        { status: 400 }
      );
    }
  }

  // Récurrence hebdomadaire (même jour/heure chaque semaine) : bornée à 52
  // occurrences (un an) pour éviter une saisie fantaisiste.
  const count =
    Number.isInteger(recurrenceCount) && recurrenceCount > 1 ? Math.min(recurrenceCount, 52) : 1;

  const baseDate = new Date(date);
  const baseEndTime = new Date(endTime);
  const baseDeadline = signupDeadline ? new Date(signupDeadline) : null;

  // La taille de chaque run est fixée par l'instance, jamais par le
  // client, pour éviter toute incohérence (voir RAID_INSTANCE_SIZES).
  const raids = await prisma.$transaction(
    Array.from({ length: count }, (_, i) => {
      const raidDate = new Date(baseDate);
      raidDate.setDate(raidDate.getDate() + 7 * i);
      const raidEndTime = new Date(baseEndTime);
      raidEndTime.setDate(raidEndTime.getDate() + 7 * i);
      const deadline = baseDeadline ? new Date(baseDeadline) : null;
      if (deadline) deadline.setDate(deadline.getDate() + 7 * i);
      return prisma.raid.create({
        data: {
          name: name.trim(),
          date: raidDate,
          endTime: raidEndTime,
          signupDeadline: deadline,
          notes: notes || null,
          createdById: session.user.id,
          phases: {
            create: phases.map((phase: { titles: string[] }, phaseIndex: number) => ({
              order: phaseIndex,
              runs: {
                create: phase.titles.map((title: string, runIndex: number) => ({
                  title,
                  size: RAID_INSTANCE_SIZES[title],
                  order: runIndex
                }))
              }
            }))
          }
        }
      });
    })
  );

  // Mode vacances : inscrit auto en absent les personnes déjà en vacances
  // pour chaque date, sans attendre qu'elles interviennent.
  for (const raid of raids) {
    await autoAbsentForVacationingUsers(raid.id, raid.date);
  }

  if (count === 1) return NextResponse.json(raids[0], { status: 201 });
  return NextResponse.json({ raids }, { status: 201 });
}
