// Mapping classe -> spécialisations disponibles.
// Centralisé ici pour pouvoir être ajusté facilement quand les infos
// officielles de World of Warcraft Forever seront connues (nouvelles
// classes, talents...).

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
  DRUIDE: ["Balance", "Feral Bear", "Restoration"],
  VOLEUR: ["Assassination", "Combat", "Subtlety"],
  CHASSEUR: ["Beast Mastery", "Marksmanship", "Survival"],
  CHAMAN: ["Elemental", "Enhancement", "Restoration"],
  GUERRIER: ["Arms", "Fury", "Protection"],
  PALADIN: ["Holy", "Protection", "Retribution"]
};

// Couleurs de classe classiques WoW, utilisées pour colorer les slots de
// composition en fonction du personnage assigné.
export const CLASS_COLORS: Record<WowClass, string> = {
  PRETRE: "#FFFFFF",
  MAGE: "#40C7EB",
  DEMONISTE: "#8787ED",
  VOLEUR: "#FFF569",
  DRUIDE: "#FF7D0A",
  CHASSEUR: "#A9D271",
  CHAMAN: "#0070DE",
  GUERRIER: "#C79C6E",
  PALADIN: "#F58CBA"
};

// Icône classe/spé (public/icons/classes/Class_Specialisation.{png,jpg}).
// La plupart des icônes sont en .png ; certaines ont été fournies en .jpg
// haute résolution et gardent ce format plutôt que d'être reconverties.
const JPG_ICONS = new Set([
  "Hunter_Beast_Mastery",
  "Paladin_Holy",
  "Paladin_Protection",
  "Paladin_Retribution",
  "Warrior_Arms",
  "Warrior_Fury",
  "Warrior_Protection"
]);

export function classSpecIconPath(wowClass: WowClass, spec: string): string {
  const fileName = `${CLASS_LABELS[wowClass]}_${spec}`.replace(/ /g, "_");
  const extension = JPG_ICONS.has(fileName) ? "jpg" : "png";
  return `/icons/classes/${fileName}.${extension}`;
}

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
