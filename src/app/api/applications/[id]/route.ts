import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET : détail d'une candidature + tous les commentaires (INTERNE + PARTAGE).
// Réservé aux comptes connectés autres que CANDIDAT.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (session.user.siteRole === "CANDIDAT") {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { discordTag: true, displayName: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { discordTag: true, displayName: true } } }
      }
    }
  });
  if (!application) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });

  return NextResponse.json(application);
}

// PATCH : change le statut d'une candidature (Officier/Administrateur).
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { status } = await req.json();
  if (!["EN_ATTENTE", "ACCEPTEE", "REFUSEE"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const application = await prisma.application.update({
    where: { id: params.id },
    data: { status }
  });
  return NextResponse.json(application);
}
