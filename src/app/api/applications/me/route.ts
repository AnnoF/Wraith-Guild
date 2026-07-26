import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchGuildMember } from "@/lib/discord";
import { isApplicationActive, reapplyAvailableAt as computeReapplyAvailableAt } from "@/lib/applicationInfo";

// GET : la candidature la plus récente du compte connecté (avec ses
// commentaires PARTAGE uniquement — jamais les notes internes), ou null
// s'il n'en a jamais déposé. Un compte peut avoir plusieurs candidatures
// dans le temps (voir POST /api/applications) : celle-ci n'est renvoyée
// que si elle est encore "active" au sens large (EN_ATTENTE/ACCEPTEE, ou
// REFUSEE depuis moins de REAPPLY_COOLDOWN_DAYS) pour l'affichage du
// statut ; `canReapply` indique si une nouvelle candidature peut être
// déposée par-dessus (candidat jamais postulé, ou refus + délai écoulé).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const application = await prisma.application.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      comments: {
        where: { visibility: "PARTAGE" },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { discordTag: true, displayName: true } } }
      }
    }
  });

  const canReapply = !application || !isApplicationActive(application);

  let isGuildMember = true;
  if (canReapply) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { discordId: true }
    });
    try {
      const member = dbUser ? await fetchGuildMember(dbUser.discordId) : null;
      isGuildMember = !!member;
    } catch (err) {
      console.error("Erreur de vérification Discord (candidature) :", err);
      isGuildMember = false;
    }
  }

  const reapplyAvailableAt =
    application?.status === "REFUSEE" && application.reviewedAt && !canReapply
      ? computeReapplyAvailableAt(application.reviewedAt).toISOString()
      : null;

  return NextResponse.json({ application, isGuildMember, canReapply, reapplyAvailableAt });
}
