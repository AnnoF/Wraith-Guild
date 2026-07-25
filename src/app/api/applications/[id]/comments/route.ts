import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewExchangeMessage } from "@/lib/discordWebhook";

// POST : ajoute un commentaire sur une candidature.
// - INTERNE : tout connecté sauf CANDIDAT (membres + officiers).
// - PARTAGE : Officier/Administrateur, ou le candidat propriétaire de la
//   candidature (il répond depuis /candidature).
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { visibility, body: text } = await req.json();
  if (!text || !["INTERNE", "PARTAGE"].includes(visibility)) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  const application = await prisma.application.findUnique({ where: { id: params.id } });
  if (!application) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });

  const isOwner = application.userId === session.user.id;
  const isStaff = canConfigureRaids(session.user.siteRole);
  const isMember = session.user.siteRole !== "CANDIDAT";

  if (visibility === "INTERNE" && !isMember) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  if (visibility === "PARTAGE" && !isStaff && !isOwner) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const comment = await prisma.applicationComment.create({
    data: {
      applicationId: params.id,
      visibility,
      body: text,
      authorId: session.user.id
    },
    include: { author: { select: { discordTag: true, displayName: true } } }
  });

  if (visibility === "PARTAGE") {
    await notifyNewExchangeMessage({
      applicationId: application.id,
      characterName: application.characterName,
      authorLabel: comment.author.displayName || comment.author.discordTag,
      body: text
    });
  }

  return NextResponse.json(comment, { status: 201 });
}
