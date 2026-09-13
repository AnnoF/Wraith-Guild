// Taille fixe par instance : plus de choix libre à la création d'un raid.
export const RAID_INSTANCE_SIZES: Record<string, number> = {
  "Barrow Deeps": 10,
  "Hyjal Summit": 20,
  "Onyxia's Lair": 40
};

export const RAID_INSTANCES = Object.keys(RAID_INSTANCE_SIZES) as RaidInstance[];

export type RaidInstance = keyof typeof RAID_INSTANCE_SIZES;

// Un même événement peut regrouper plusieurs instances (soirée à plusieurs
// raids), mais jamais de tailles différentes (pas de 40 et 20 le même soir).
export function instancesShareSize(titles: string[]): boolean {
  const sizes = new Set(titles.map((t) => RAID_INSTANCE_SIZES[t]));
  return sizes.size <= 1;
}

export function raidTitleLabel(titles: string[]): string {
  return titles.join(" + ");
}
