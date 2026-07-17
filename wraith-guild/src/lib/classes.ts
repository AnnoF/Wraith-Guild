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
  PRETRE: "Prêtre",
  MAGE: "Mage",
  DEMONISTE: "Démoniste",
  DRUIDE: "Druide",
  VOLEUR: "Voleur",
  CHASSEUR: "Chasseur",
  CHAMAN: "Chaman",
  GUERRIER: "Guerrier",
  PALADIN: "Paladin"
};

export const CLASS_SPECS: Record<WowClass, string[]> = {
  PRETRE: ["Discipline", "Sacré", "Ombre"],
  MAGE: ["Arcanes", "Feu", "Givre"],
  DEMONISTE: ["Affliction", "Démonologie", "Destruction"],
  DRUIDE: ["Équilibre", "Farouche", "Restauration"],
  VOLEUR: ["Assassinat", "Combat", "Finesse"],
  CHASSEUR: ["Bêtes", "Précision", "Survie"],
  CHAMAN: ["Élémentaire", "Amélioration", "Restauration"],
  GUERRIER: ["Armes", "Fureur", "Protection"],
  PALADIN: ["Sainteté", "Protection", "Vindicte"]
};

// Rôle de raid déduit de la spé (utile pour les compos : tanks / heals / dps)
export type RaidRole = "TANK" | "SOIGNEUR" | "DPS";

export const SPEC_ROLE: Record<string, RaidRole> = {
  Protection: "TANK", // attention : Guerrier ET Paladin ont une spé "Protection"
  Discipline: "SOIGNEUR",
  Sacré: "SOIGNEUR",
  Restauration: "SOIGNEUR",
  Sainteté: "SOIGNEUR"
};

export function guessRaidRole(charClass: WowClass, spec: string): RaidRole {
  if (SPEC_ROLE[spec]) return SPEC_ROLE[spec];
  return "DPS";
}
