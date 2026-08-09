import type { RecruitmentPriority } from "@prisma/client";
import { WOW_CLASSES, type WowClass } from "./classes";
import { prisma } from "./prisma";

// État du recrutement affiché sur la page vitrine : chaque classe (toutes
// spés confondues) est rangée dans un niveau de priorité. Éditable par les
// Officiers/Administrateurs depuis GuildShowcase (voir RecruitmentEditor et
// /api/recruitment). Le style/libellé de chaque niveau reste fixe ici ; seule
// l'affectation classe -> niveau est stockée en base (RecruitmentStatus).

export const RECRUITMENT_PRIORITIES: RecruitmentPriority[] = ["HAUT", "MOYEN", "BAS", "FERME"];

export const RECRUITMENT_COLUMN_META: Record<
  RecruitmentPriority,
  { label: string; textClass: string; tintClass: string; iconClass?: string }
> = {
  HAUT: { label: "Haut", textClass: "text-moss", tintClass: "bg-moss/15 border border-moss/40" },
  MOYEN: { label: "Moyen", textClass: "text-amber", tintClass: "bg-amber/15 border border-amber/40" },
  BAS: {
    label: "Bas",
    textClass: "text-blood",
    tintClass: "bg-blood/15 border border-blood/40",
    iconClass: "opacity-80"
  },
  FERME: {
    label: "Fermé",
    textClass: "text-bone/45",
    tintClass: "bg-char border border-bone/10",
    iconClass: "opacity-40 grayscale"
  }
};

// Valeurs de repli utilisées uniquement pour amorcer la table au tout
// premier accès (avant qu'un Officier n'ait rien édité depuis GuildShowcase).
// Une fois la table peuplée, ces valeurs ne sont plus lues.
const DEFAULT_RECRUITMENT: Record<WowClass, RecruitmentPriority> = {
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

export async function getRecruitmentStatus(): Promise<Record<WowClass, RecruitmentPriority>> {
  const rows = await prisma.recruitmentStatus.findMany();
  if (rows.length === 0) {
    await prisma.recruitmentStatus.createMany({
      data: WOW_CLASSES.map((wowClass) => ({ wowClass, priority: DEFAULT_RECRUITMENT[wowClass] }))
    });
    return { ...DEFAULT_RECRUITMENT };
  }

  const status = { ...DEFAULT_RECRUITMENT };
  for (const row of rows) status[row.wowClass] = row.priority;
  return status;
}

export interface RecruitmentColumn {
  priority: RecruitmentPriority;
  label: string;
  textClass: string;
  tintClass: string;
  iconClass?: string;
  classes: WowClass[];
}

export function groupByColumn(status: Record<WowClass, RecruitmentPriority>): RecruitmentColumn[] {
  return RECRUITMENT_PRIORITIES.map((priority) => ({
    priority,
    ...RECRUITMENT_COLUMN_META[priority],
    classes: WOW_CLASSES.filter((wowClass) => status[wowClass] === priority)
  }));
}
