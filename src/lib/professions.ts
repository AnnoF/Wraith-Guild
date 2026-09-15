export const PROFESSIONS = [
  "HERBALISM",
  "MINING",
  "SKINNING",
  "ALCHEMY",
  "BLACKSMITHING",
  "ENCHANTING",
  "ENGINEERING",
  "LEATHERWORKING",
  "TAILORING"
] as const;

export type Profession = (typeof PROFESSIONS)[number];

export const PROFESSION_LABELS: Record<Profession, string> = {
  HERBALISM: "Herbalism",
  MINING: "Mining",
  SKINNING: "Skinning",
  ALCHEMY: "Alchemy",
  BLACKSMITHING: "Blacksmithing",
  ENCHANTING: "Enchanting",
  ENGINEERING: "Engineering",
  LEATHERWORKING: "Leatherworking",
  TAILORING: "Tailoring"
};

export const MAX_PROFESSIONS_PER_CHARACTER = 2;
