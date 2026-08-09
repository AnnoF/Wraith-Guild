import type { RecruitmentPriority } from "@prisma/client";
import { CLASS_SPECS, WOW_CLASSES, type WowClass } from "./classes";
import { prisma } from "./prisma";

// État du recrutement affiché sur la page vitrine : chaque spécialisation
// (classe + spé) est rangée dans un niveau de priorité. Éditable par les
// Officiers/Administrateurs depuis GuildShowcase (voir RecruitmentEditor et
// /api/recruitment). Le style/libellé de chaque niveau reste fixe ici ; seule
// l'affectation spé -> niveau est stockée en base (RecruitmentStatus).

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

export interface SpecKey {
  wowClass: WowClass;
  spec: string;
}

export function specKey(wowClass: WowClass, spec: string): string {
  return `${wowClass}::${spec}`;
}

export function allSpecs(): SpecKey[] {
  return WOW_CLASSES.flatMap((wowClass) => CLASS_SPECS[wowClass].map((spec) => ({ wowClass, spec })));
}

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

export interface RecruitmentColumn {
  priority: RecruitmentPriority;
  label: string;
  textClass: string;
  tintClass: string;
  iconClass?: string;
  specs: SpecKey[];
}

export function groupByColumn(status: Record<string, RecruitmentPriority>): RecruitmentColumn[] {
  const specs = allSpecs();
  return RECRUITMENT_PRIORITIES.map((priority) => ({
    priority,
    ...RECRUITMENT_COLUMN_META[priority],
    specs: specs.filter(({ wowClass, spec }) => status[specKey(wowClass, spec)] === priority)
  }));
}
