export const GROUP_SIZE = 5;

// Classes Tailwind statiques (nécessaire : Tailwind ne génère que les
// classes qu'il trouve littéralement dans le code source).
export const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4"
};

// Regroupe les groupes de 5 par ligne : 4 par ligne par défaut, sauf pour
// un raid de 25 (5 groupes) qu'on affiche en 2 puis 3.
export function groupRows(size: number, numGroups: number): number[][] {
  if (size === 25) return [[0, 1], [2, 3, 4]];
  const rows: number[][] = [];
  for (let i = 0; i < numGroups; i += 4) {
    rows.push(Array.from({ length: Math.min(4, numGroups - i) }, (_, j) => i + j));
  }
  return rows;
}
