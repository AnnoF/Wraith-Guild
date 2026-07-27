import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyNewExchangeMessage, candidateApplicationUrl } from "@/lib/discordWebhook";
import { sendDirectMessage } from "@/lib/discord";

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

  const application = await prisma.application.findUnique({
    where: { id: params.id },
    include: { user: { select: { discordId: true } } }
  });
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

  const lastComment = await prisma.applicationComment.findFirst({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" }
  });
  if (lastComment && Date.now() - lastComment.createdAt.getTime() < 60_000) {
    return NextResponse.json(
      { error: "Merci de patienter une minute avant d'envoyer un nouveau message." },
      { status: 429 }
    );
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
    if (!isStaff) {
      // Le candidat répond : on alerte le salon officiers pour qu'ils
      // sachent qu'il faut aller regarder. Un officier qui répond n'a pas
      // besoin d'être notifié de son propre message.
      await notifyNewExchangeMessage({
        applicationId: application.id,
        characterName: application.characterName,
        authorLabel: comment.author.displayName || comment.author.discordTag,
        body: text
      });
    } else if (!isOwner) {
      // Un officier a répondu au candidat : on le prévient en DM (l'échange
      // reste de toute façon visible sur /candidature même si le DM échoue).
      await sendDirectMessage(
        application.user.discordId,
        `💬 Un officier de Wraith-Guild a répondu à votre candidature :\n> ${text}\n\nConsultez et répondez ici : ${candidateApplicationUrl()}`
      );
    }
  }

  return NextResponse.json(comment, { status: 201 });
}
