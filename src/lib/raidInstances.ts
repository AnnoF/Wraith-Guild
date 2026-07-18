// Taille fixe par instance : plus de choix libre à la création d'un raid.
export const RAID_INSTANCE_SIZES: Record<string, number> = {
  "Molten Core": 40,
  "Onyxia's Lair": 40,
  "Blackwing Lair": 40,
  "Ahn'Qiraj Temple": 40,
  Naxxramas: 40,
  "World Boss": 40,
  "Zul'Gurub": 20,
  "Ahn'Qiraj Ruins": 20
};

export const RAID_INSTANCES = Object.keys(RAID_INSTANCE_SIZES) as RaidInstance[];

export type RaidInstance = keyof typeof RAID_INSTANCE_SIZES;
