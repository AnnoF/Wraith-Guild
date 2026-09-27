import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDirectMessage } from "@/lib/discord";
import { candidateApplicationUrl } from "@/lib/discordWebhook";

// GET : détail d'une candidature + tous les commentaires (INTERNE + PARTAGE).
// Réservé aux comptes connectés autres que CANDIDAT.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (session.user.siteRole === "CANDIDAT") {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const application = await prisma.application.findUnique({
    where: { id },
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
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { status } = await req.json();
  if (!["EN_ATTENTE", "APPLY", "ACCEPTEE", "REFUSEE"].includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const existing = await prisma.application.findUnique({
    where: { id },
    include: { user: { select: { id: true, discordId: true, siteRole: true } } }
  });
  if (!existing) return NextResponse.json({ error: "Candidature introuvable" }, { status: 404 });

  const application = await prisma.application.update({
    where: { id },
    data: {
      status,
      // Sert au délai avant de pouvoir repostuler après un refus (voir
      // POST /api/applications) ; réinitialisé si on repasse en attente.
      reviewedAt: status === "EN_ATTENTE" ? null : status !== existing.status ? new Date() : existing.reviewedAt
    }
  });

  // Une candidature acceptée n'a plus besoin d'échange : on supprime les
  // deux espaces de commentaires (INTERNE et PARTAGE).
  if (status === "ACCEPTEE" && status !== existing.status) {
    await prisma.applicationComment.deleteMany({ where: { applicationId: id } });
  }

  // Le statut Apply bascule le rôle site du candidat en APPLY (peut alors
  // s'inscrire aux raids comme un Member/Social, badge "A" en composition,
  // voir RankBadge) ; un retour en arrière (Refusée/En attente) le repasse
  // en CANDIDAT. Accepter ne change pas le rôle automatiquement : ça reste
  // une action manuelle d'un Administrateur une fois la personne invitée
  // sur le Discord de guilde (voir /admin). Le job quotidien de
  // resynchronisation Discord (POST /api/cron/sync-roles) ne touche jamais
  // APPLY.
  if (status !== existing.status) {
    if (status === "APPLY" && existing.user.siteRole === "CANDIDAT") {
      await prisma.$transaction([
        prisma.user.update({ where: { id: existing.user.id }, data: { siteRole: "APPLY" } }),
        prisma.roleAudit.create({
          data: {
            targetUserId: existing.user.id,
            grantedById: session.user.id,
            previousRole: "CANDIDAT",
            newRole: "APPLY"
          }
        })
      ]);
    } else if (existing.user.siteRole === "APPLY" && (status === "REFUSEE" || status === "EN_ATTENTE")) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: existing.user.id }, data: { siteRole: "CANDIDAT" } }),
        prisma.roleAudit.create({
          data: {
            targetUserId: existing.user.id,
            grantedById: session.user.id,
            previousRole: "APPLY",
            newRole: "CANDIDAT"
          }
        })
      ]);
    }
  }

  if (status !== existing.status && (status === "APPLY" || status === "ACCEPTEE" || status === "REFUSEE")) {
    const message =
      status === "APPLY"
        ? `👀 Votre candidature à Wraith-Guild passe en statut **Apply** : vous allez être testé·e en raid avant une décision finale. Vous pouvez dès maintenant vous inscrire aux raids.\n\n${candidateApplicationUrl()}`
        : status === "ACCEPTEE"
        ? `🎉 Votre candidature à Wraith-Guild a été **acceptée** ! Un officier va vous contacter pour la suite.\n\n${candidateApplicationUrl()}`
        : `Votre candidature à Wraith-Guild a été **refusée**. Vous pourrez postuler à nouveau dans 30 jours.\n\n${candidateApplicationUrl()}`;
    await sendDirectMessage(existing.user.discordId, message);
  }

  return NextResponse.json(application);
}
