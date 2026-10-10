import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDirectMessage } from "@/lib/discord";
import { chunkLines, findMissingUsers, isReminderDue, REMINDER_LEAD_MS, userLabel } from "@/lib/signupReminder";

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris"
};

const pause = () => new Promise((r) => setTimeout(r, 250));

// POST : 12 h avant la date limite d'inscription d'un raid, envoie en DM
// (1) la liste des membres sans réponse à tous les Officiers/Admins et
// (2) un rappel avec le lien du raid à chacun de ces membres. Appelé
// toutes les 30 min par .github/workflows/signup-reminders.yml, protégé
// par CRON_SECRET comme /api/cron/sync-roles. `signupReminderSentAt`
// garantit un seul rappel par raid.
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const now = new Date();
  const candidates = await prisma.raid.findMany({
    where: {
      status: "OUVERT",
      signupReminderSentAt: null,
      signupDeadline: { gt: now, lte: new Date(now.getTime() + REMINDER_LEAD_MS) }
    },
    select: { id: true, name: true, date: true, status: true, signupDeadline: true, signupReminderSentAt: true }
  });
  const raids = candidates.filter((r) => isReminderDue(r, now));
  if (raids.length === 0) return NextResponse.json({ raids: 0, remindersSent: 0 });

  const members = await prisma.user.findMany({
    where: { isArchived: false, siteRole: { not: "CANDIDAT" } },
    select: {
      id: true,
      discordId: true,
      discordTag: true,
      displayName: true,
      siteRole: true,
      vacationStart: true,
      vacationEnd: true
    }
  });
  const officers = members.filter((m) => m.siteRole === "OFFICIER" || m.siteRole === "ADMINISTRATEUR");
  const base = process.env.NEXTAUTH_URL || "";

  let remindersSent = 0;
  for (const raid of raids) {
    // Réserve le raid d'abord : si deux exécutions se chevauchent, seule
    // celle dont l'updateMany conditionnel réussit envoie les messages.
    const claim = await prisma.raid.updateMany({
      where: { id: raid.id, signupReminderSentAt: null },
      data: { signupReminderSentAt: now }
    });
    if (claim.count === 0) continue;

    const signups = await prisma.raidSignup.findMany({ where: { raidId: raid.id }, select: { userId: true } });
    const missing = findMissingUsers(members, new Set(signups.map((s) => s.userId)), raid.date);
    if (missing.length === 0) continue;

    const dateLabel = raid.date.toLocaleString("fr-FR", DATE_FORMAT);
    const deadlineLabel = raid.signupDeadline!.toLocaleString("fr-FR", DATE_FORMAT);
    const url = `${base}/raids/${raid.id}`;

    const header = `📋 **${raid.name}** (${dateLabel}) — fin des inscriptions dans 12 h (${deadlineLabel}).\n${missing.length} membre(s) sans réponse (ni inscrit, ni absent, ni vacances) :`;
    const lines = missing.map((u) => `• ${userLabel(u)}`);
    for (const officer of officers) {
      for (const msg of chunkLines(header, lines)) {
        await sendDirectMessage(officer.discordId, msg);
      }
      await pause();
    }

    for (const u of missing) {
      const ok = await sendDirectMessage(
        u.discordId,
        `⏰ Rappel : tu n'es pas encore inscrit à **${raid.name}** (${dateLabel}). Les inscriptions se terminent le ${deadlineLabel}. Inscris-toi, ou indique ton absence, ici : ${url}`
      );
      if (ok) remindersSent++;
      await pause();
    }
  }

  return NextResponse.json({ raids: raids.length, remindersSent });
}
