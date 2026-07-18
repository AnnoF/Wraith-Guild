// Mapping classe -> spécialisations disponibles.
// Centralisé ici pour pouvoir être ajusté facilement quand les infos
// officielles de Camelote seront connues (nouvelles classes, talents...).

export const WOW_CLASSES = [
  "PRETRE",
  "MAGE",
  "DEMONISTE",
  "DRUIDE",
  "VOLEUR",
  "CHASSEUR",
  "CHAMAN",
  "GUERRIER",
  "PALADIN"
] as const;

export type WowClass = (typeof WOW_CLASSES)[number];

export const CLASS_LABELS: Record<WowClass, string> = {
  PRETRE: "Priest",
  MAGE: "Mage",
  DEMONISTE: "Warlock",
  DRUIDE: "Druid",
  VOLEUR: "Rogue",
  CHASSEUR: "Hunter",
  CHAMAN: "Shaman",
  GUERRIER: "Warrior",
  PALADIN: "Paladin"
};

export const CLASS_SPECS: Record<WowClass, string[]> = {
  PRETRE: ["Discipline", "Holy", "Shadow"],
  MAGE: ["Arcane", "Fire", "Frost"],
  DEMONISTE: ["Affliction", "Demonology", "Destruction"],
  DRUIDE: ["Balance", "Feral Bear", "Feral Cat", "Restoration"],
  VOLEUR: ["Assassination", "Combat", "Subtlety"],
  CHASSEUR: ["Beast Mastery", "Marksmanship", "Survival"],
  CHAMAN: ["Elemental", "Enhancement", "Restoration"],
  GUERRIER: ["Arms", "Fury", "Protection"],
  PALADIN: ["Holy", "Protection", "Retribution"]
};

// Couleurs de classe classiques WoW, utilisées pour colorer les slots de
// composition en fonction du personnage assigné.
export const CLASS_COLORS: Record<WowClass, string> = {
  GUERRIER: "#C79C6E",
  PALADIN: "#F58CBA",
  CHASSEUR: "#ABD473",
  VOLEUR: "#FFF569",
  PRETRE: "#FFFFFF",
  CHAMAN: "#0070DE",
  MAGE: "#69CCF0",
  DEMONISTE: "#9482C9",
  DRUIDE: "#FF7D0A"
};

// Rôle de raid déduit de la spé (utile pour les compos : tanks / heals / dps)
export type RaidRole = "TANK" | "SOIGNEUR" | "DPS";

export const SPEC_ROLE: Record<string, RaidRole> = {
  Protection: "TANK", // attention : Guerrier ET Paladin ont une spé "Protection"
  "Feral Bear": "TANK",
  Discipline: "SOIGNEUR",
  Holy: "SOIGNEUR", // attention : Prêtre ET Paladin ont une spé "Holy"
  Restoration: "SOIGNEUR",

  // Anciens noms de spé en français, conservés pour les personnages créés
  // avant le passage à l'anglais (voir schema.prisma, Character.spec)
  Sacré: "SOIGNEUR",
  Sainteté: "SOIGNEUR",
  Restauration: "SOIGNEUR"
};

export function guessRaidRole(charClass: WowClass, spec: string): RaidRole {
  if (SPEC_ROLE[spec]) return SPEC_ROLE[spec];
  return "DPS";
}
