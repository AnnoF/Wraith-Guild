import type { Raid } from "@prisma/client";

// Une fois la date limite d'inscription dépassée, un raid encore marqué
// OUVERT en base est traité comme FERME sans qu'un Officier ait besoin de
// cliquer sur "Fermer les inscriptions". De même, une fois la date du
// raid passée, il est traité comme TERMINE (sauf s'il a été ANNULE) sans
// qu'un Officier ait besoin de cliquer sur "Marquer comme terminé" — ça
// reste un statut calculé à l'affichage, pas écrit en base.
export function effectiveRaidStatus(raid: Pick<Raid, "status" | "signupDeadline" | "date">): Raid["status"] {
  if (raid.status === "ANNULE") return "ANNULE";
  if (new Date() > raid.date) return "TERMINE";
  if (raid.status === "OUVERT" && raid.signupDeadline && new Date() > raid.signupDeadline) {
    return "FERME";
  }
  return raid.status;
}
