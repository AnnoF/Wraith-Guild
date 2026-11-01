import type { RecruitmentPriority } from "@/generated/prisma/client";
import { CLASS_SPECS, WOW_CLASSES, type WowClass } from "./classes";

// Partie « pure » du recrutement (aucun accès base) : importable depuis un
// composant client. L'accès à RecruitmentStatus est dans ./recruitment.ts,
// qui importe prisma — ne jamais l'importer depuis un composant "use client"
// (le pilote pg embarqué côté navigateur ferait échouer le build).

export const RECRUITMENT_PRIORITIES: RecruitmentPriority[] = ["HAUT", "MOYEN", "BAS", "FERME"];

export const RECRUITMENT_COLUMN_META: Record<
  RecruitmentPriority,
  { label: string; textClass: string; tintClass: string; iconClass?: string }
> = {
  HAUT: { label: "Haut", textClass: "text-moss", tintClass: "bg-moss/15 border border-moss/40" },
  MOYEN: { label: "Moyen", textClass: "text-amber", tintClass: "bg-amber/15 border border-amber/40" },
  BAS: {
    label: "Bas",
    textClass: "text-garnet",
    tintClass: "bg-garnet/15 border border-garnet/40",
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
