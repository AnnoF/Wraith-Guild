import type { Raid } from "@prisma/client";

// Une fois la date limite d'inscription dépassée, un raid encore marqué
// OUVERT en base est traité comme FERME sans qu'un Officier ait besoin de
// cliquer sur "Fermer les inscriptions".
export function effectiveRaidStatus(raid: Pick<Raid, "status" | "signupDeadline">): Raid["status"] {
  if (raid.status === "OUVERT" && raid.signupDeadline && new Date() > raid.signupDeadline) {
    return "FERME";
  }
  return raid.status;
}
