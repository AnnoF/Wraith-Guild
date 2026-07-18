export const RAID_INSTANCES = [
  "Molten Core",
  "Blackwing Lair",
  "Onyxia's Lair",
  "Naxxramas",
  "Zul'Gurub",
  "Ahn'Qiraj Ruins",
  "Ahn'Qiraj Temple",
  "World Boss"
] as const;

export type RaidInstance = (typeof RAID_INSTANCES)[number];
