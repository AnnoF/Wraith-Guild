import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchGuildMember } from "@/lib/discord";

// GET : la candidature du compte connecté (avec ses commentaires PARTAGE
// uniquement — jamais les notes internes), ou null s'il n'en a pas. Dans
// ce dernier cas, indique aussi s'il a rejoint le Discord de guilde
// (condition pour pouvoir postuler, voir POST /api/applications) — sans
// ça, le bot ne pourrait pas lui envoyer les réponses des officiers en DM.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const application = await prisma.application.findUnique({
    where: { userId: session.user.id },
    include: {
      comments: {
        where: { visibility: "PARTAGE" },
        orderBy: { createdAt: "asc" },
        include: { author: { select: { discordTag: true, displayName: true } } }
      }
    }
  });

  if (application) {
    return NextResponse.json({ application, isGuildMember: true });
  }

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
    isGuildMember = false;
  }

  return NextResponse.json({ application: null, isGuildMember });
}
