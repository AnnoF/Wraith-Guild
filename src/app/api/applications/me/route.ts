import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET : la candidature du compte connecté (avec ses commentaires PARTAGE
// uniquement — jamais les notes internes), ou null s'il n'en a pas.
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

  return NextResponse.json(application);
}
