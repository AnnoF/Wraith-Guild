export const PROFESSIONS = [
  "HERBALISM",
  "MINING",
  "SKINNING",
  "ALCHEMY",
  "BLACKSMITHING",
  "ENCHANTING",
  "ENGINEERING",
  "LEATHERWORKING",
  "TAILORING",
  "CAMPING"
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
  TAILORING: "Tailoring",
  CAMPING: "Camping"
};

export const MAX_PROFESSIONS_PER_CHARACTER = 2;
