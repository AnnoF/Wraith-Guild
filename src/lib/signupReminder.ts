// Rappel d'inscription : 12 h avant la date limite d'inscription d'un raid,
// on repère les membres qui n'ont rien indiqué (ni inscrit, ni absent, ni
// mode vacances) pour les relancer et en informer les Officiers. Les
// fonctions de ce fichier sont pures (testées) ; l'envoi des DM est fait
// par la route POST /api/cron/signup-reminders.

export const REMINDER_LEAD_MS = 12 * 60 * 60 * 1000;

// Un rappel est dû quand on est entré dans la fenêtre des 12 h précédant la
// date limite, sans l'avoir dépassée, pour un raid encore ouvert.
export function isReminderDue(
  raid: { status: string; signupDeadline: Date | null; signupReminderSentAt: Date | null },
  now: Date
): boolean {
  if (raid.status !== "OUVERT" || !raid.signupDeadline || raid.signupReminderSentAt) return false;
  const deadline = raid.signupDeadline.getTime();
  return now.getTime() >= deadline - REMINDER_LEAD_MS && now.getTime() < deadline;
}

type Candidate = {
  id: string;
  vacationStart: Date | null;
  vacationEnd: Date | null;
};

// Membres sans aucune réponse pour ce raid. `respondedUserIds` = ceux qui
// ont une ligne RaidSignup (quel que soit son statut : ils se sont déjà
// manifestés). Les personnes en vacances à la date du raid sont exclues.
export function findMissingUsers<T extends Candidate>(
  members: T[],
  respondedUserIds: Set<string>,
  raidDate: Date
): T[] {
  return members.filter((u) => {
    if (respondedUserIds.has(u.id)) return false;
    const onVacation =
      u.vacationStart && u.vacationEnd && u.vacationStart <= raidDate && u.vacationEnd >= raidDate;
    return !onVacation;
  });
}

export function userLabel(u: { displayName: string | null; discordTag: string }) {
  return u.displayName || u.discordTag;
}

// Découpe une liste de lignes en messages de moins de `max` caractères
// (limite Discord : 2000).
export function chunkLines(header: string, lines: string[], max = 1900): string[] {
  const messages: string[] = [];
  let current = header;
  for (const line of lines) {
    if (current.length + line.length + 1 > max) {
      messages.push(current);
      current = "";
    }
    current += (current ? "\n" : "") + line;
  }
  if (current) messages.push(current);
  return messages;
}
