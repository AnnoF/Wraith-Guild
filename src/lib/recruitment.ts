import type { WowClass } from "./classes";

// Colonnes de l'état du recrutement affichées sur la page vitrine.
// Chaque colonne liste les classes (toutes spés confondues) recherchées à
// ce niveau de priorité. À ajuster librement selon les besoins de compo.

export interface RecruitmentColumn {
  label: string;
  textClass: string; // classe Tailwind de couleur du texte du label
  tintClass: string; // classes Tailwind de fond/bordure teintées du bloc d'icônes
  iconClass?: string; // classes Tailwind additionnelles appliquées aux icônes (ex: grisées)
  classes: WowClass[];
}

export const RECRUITMENT_COLUMNS: RecruitmentColumn[] = [
  {
    label: "Haut",
    textClass: "text-moss",
    tintClass: "bg-moss/15 border border-moss/40",
    classes: ["PRETRE", "MAGE", "DEMONISTE"]
  },
  {
    label: "Moyen",
    textClass: "text-amber",
    tintClass: "bg-amber/15 border border-amber/40",
    classes: ["VOLEUR", "DRUIDE"]
  },
  {
    label: "Bas",
    textClass: "text-blood",
    tintClass: "bg-blood/15 border border-blood/40",
    iconClass: "opacity-80",
    classes: ["CHASSEUR", "CHAMAN"]
  },
  {
    label: "Fermé",
    textClass: "text-bone/45",
    tintClass: "bg-char border border-bone/10",
    iconClass: "opacity-40 grayscale",
    classes: ["GUERRIER", "PALADIN"]
  }
];
