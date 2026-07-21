import type { WowClass } from "./classes";

// Colonnes de l'état du recrutement affichées sur la page vitrine.
// Chaque colonne liste les classes (toutes spés confondues) recherchées à
// ce niveau de priorité. À ajuster librement selon les besoins de compo.

export interface RecruitmentColumn {
  label: string;
  colorClass: string; // classe Tailwind de fond pour le bandeau du titre
  classes: WowClass[];
}

export const RECRUITMENT_COLUMNS: RecruitmentColumn[] = [
  { label: "Haut", colorClass: "bg-moss", classes: ["PRETRE", "MAGE", "DEMONISTE"] },
  { label: "Moyen", colorClass: "bg-amber", classes: ["VOLEUR", "DRUIDE"] },
  { label: "Bas", colorClass: "bg-bone/30", classes: ["CHASSEUR", "CHAMAN"] },
  { label: "Fermé", colorClass: "bg-blood", classes: ["GUERRIER", "PALADIN"] }
];
