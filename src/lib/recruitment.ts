import type { RecruitmentPriority } from "@/generated/prisma/client";
import type { WowClass } from "./classes";
import { prisma } from "./prisma";
import { allSpecs, specKey } from "./recruitmentShared";

// État du recrutement affiché sur la page vitrine : chaque spécialisation
// (classe + spé) est rangée dans un niveau de priorité. Éditable par les
// Officiers/Administrateurs depuis GuildShowcase (voir RecruitmentEditor et
// /api/recruitment). Le style/libellé de chaque niveau reste fixe (voir
// ./recruitmentShared) ; seule l'affectation spé -> niveau est stockée en base
// (RecruitmentStatus). Ce fichier est réservé au serveur : un composant client
// doit importer ./recruitmentShared, pas celui-ci.

export * from "./recruitmentShared";

// Valeurs de repli par classe (appliquées à toutes ses spés) utilisées
// uniquement pour amorcer la table au tout premier accès (avant qu'un
// Officier n'ait rien édité depuis GuildShowcase). Une fois la table
// peuplée, ces valeurs ne sont plus lues.
const DEFAULT_RECRUITMENT_BY_CLASS: Record<WowClass, RecruitmentPriority> = {
  PRETRE: "HAUT",
  MAGE: "HAUT",
  DEMONISTE: "HAUT",
  VOLEUR: "MOYEN",
  DRUIDE: "MOYEN",
  CHASSEUR: "BAS",
  CHAMAN: "BAS",
  GUERRIER: "FERME",
  PALADIN: "FERME"
};

export async function getRecruitmentStatus(): Promise<Record<string, RecruitmentPriority>> {
  const specs = allSpecs();
  const rows = await prisma.recruitmentStatus.findMany();

  const status: Record<string, RecruitmentPriority> = {};
  for (const { wowClass, spec } of specs) {
    status[specKey(wowClass, spec)] = DEFAULT_RECRUITMENT_BY_CLASS[wowClass];
  }

  if (rows.length === 0) {
    await prisma.recruitmentStatus.createMany({
      data: specs.map(({ wowClass, spec }) => ({
        wowClass,
        spec,
        priority: DEFAULT_RECRUITMENT_BY_CLASS[wowClass]
      }))
    });
    return status;
  }

  for (const row of rows) status[specKey(row.wowClass, row.spec)] = row.priority;
  return status;
}
