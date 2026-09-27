// Taille fixe par instance : plus de choix libre à la création d'un raid.
export const RAID_INSTANCE_SIZES: Record<string, number> = {
  "Barrow Deeps": 10,
  "Hyjal Summit": 20,
  "Onyxia's Lair": 40
};

export const RAID_INSTANCES = Object.keys(RAID_INSTANCE_SIZES) as RaidInstance[];

export type RaidInstance = keyof typeof RAID_INSTANCE_SIZES;

// Une même phase peut regrouper plusieurs instances concurrentes, mais
// jamais de tailles différentes (pas de 40 et 20 en même temps). Un titre
// absent de RAID_INSTANCE_SIZES est toujours considéré comme une taille
// différente des autres, y compris d'un autre titre inconnu — on ne
// suppose jamais qu'une taille inconnue "correspond" à une autre.
export function instancesShareSize(titles: string[]): boolean {
  if (titles.length === 0) return true;
  if (titles.some((t) => RAID_INSTANCE_SIZES[t] === undefined)) return false;
  const sizes = new Set(titles.map((t) => RAID_INSTANCE_SIZES[t]));
  return sizes.size <= 1;
}

// Résumé compact du déroulement d'une soirée pour l'affichage (cartes,
// vitrine) : les instances d'une même phase (concurrentes) sont jointes
// par "+" (regroupées avec un "×N" si répétées), les phases successives
// par "→". Ex: "Onyxia's Lair → Hyjal Summit ×2".
export function programSummary(phases: { runs: { title: string }[] }[]): string {
  return phases
    .map((phase) => {
      const counts = new Map<string, number>();
      phase.runs.forEach((r) => counts.set(r.title, (counts.get(r.title) ?? 0) + 1));
      return Array.from(counts.entries())
        .map(([title, count]) => (count > 1 ? `${title} ×${count}` : title))
        .join(" + ");
    })
    .join(" → ");
}

// Sérialisation compacte du programme dans une URL (voir "Dupliquer ce
// raid" dans le constructeur de composition, et le formulaire de
// création) : ";" sépare les phases, "," sépare les instances
// concurrentes d'une même phase.
export function encodeProgram(phases: string[][]): string {
  return phases.map((phase) => phase.join(",")).join(";");
}
export function decodeProgram(value: string): string[][] {
  return value
    .split(";")
    .map((phase) => phase.split(",").filter((t) => (RAID_INSTANCES as string[]).includes(t)))
    .filter((phase) => phase.length > 0);
}
