import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET : statistiques de présence par membre, sur tous les raids passés
// (date dépassée, hors raids annulés). Réservé aux Officiers/Administrateurs.
// Règles : inscrit + placé dans la composition, ou en réserve (bench) =
// présent ; inscrit en absent = absent ; ni l'un ni l'autre (pas inscrit,
// ou désisté) = déserteur.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const [pastRaids, members] = await Promise.all([
    prisma.raid.findMany({
      where: { status: { not: "ANNULE" }, date: { lt: new Date() } },
      select: { id: true, signups: { select: { userId: true, status: true } } }
    }),
    prisma.user.findMany({
      where: { siteRole: { not: "CANDIDAT" } },
      select: { id: true, discordTag: true, displayName: true, siteRole: true, isArchived: true }
    })
  ]);

  const totalRaids = pastRaids.length;

  const stats = members.map((m) => {
    let present = 0;
    let absent = 0;
    let deserter = 0;

    for (const raid of pastRaids) {
      const signup = raid.signups.find((s) => s.userId === m.id);
      if (!signup || signup.status === "DESISTE") deserter++;
      else if (signup.status === "ABSENT") absent++;
      else present++; // INSCRIT ou RESERVE (bench)
    }

    return {
      ...m,
      present,
      absent,
      deserter,
      totalRaids,
      rate: totalRaids > 0 ? present / totalRaids : null
    };
  });

  stats.sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1));

  return NextResponse.json({ totalRaids, members: stats });
}
