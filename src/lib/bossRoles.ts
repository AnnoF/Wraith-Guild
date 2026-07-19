// Rôles spécifiques par boss, pour le "mode avancé" de la composition.
// Défini par titre de raid ; un raid sans entrée ici n'a pas de mode
// avancé disponible (affiche un message d'attente).
// col/row = position explicite dans la grille du boss (1-indexé).

export interface BossRoleSlot {
  label: string;
  col: number;
  row: number;
}

export interface BossRoles {
  boss: string;
  cols: number;
  roles: BossRoleSlot[];
}

const TANK_TRIO_WITH_MD: BossRoleSlot[] = [
  { label: "Main Tank", col: 1, row: 1 },
  { label: "Off Tank 1", col: 2, row: 1 },
  { label: "Off Tank 2", col: 3, row: 1 },
  { label: "Misdirection 1 (→ Off Tank 1)", col: 2, row: 2 },
  { label: "Misdirection 2 (→ Off Tank 2)", col: 3, row: 2 }
];

// 4 slots empilés dans une colonne, à partir de la ligne 2 (ligne 1 = tanks)
function healerColumn(label: string, col: number): BossRoleSlot[] {
  return [2, 3, 4, 5].map((row, i) => ({ label: `${label} ${i + 1}`, col, row }));
}

export const RAID_BOSS_ROLES: Record<string, BossRoles[]> = {
  "Molten Core": [
    { boss: "Lucifron", cols: 3, roles: TANK_TRIO_WITH_MD },
    { boss: "Magmadar", cols: 1, roles: [{ label: "Main Tank", col: 1, row: 1 }] },
    { boss: "Gehennas", cols: 3, roles: TANK_TRIO_WITH_MD },
    {
      boss: "Garr",
      cols: 4,
      roles: [
        { label: "Main Tank", col: 1, row: 1 },
        { label: "Tank/Ban Add 1 (Skull)", col: 1, row: 2 },
        { label: "Tank/Ban Add 2 (Cross)", col: 2, row: 2 },
        { label: "Tank/Ban Add 3 (Square)", col: 3, row: 2 },
        { label: "Tank/Ban Add 4 (Moon)", col: 4, row: 2 },
        { label: "Tank/Ban Add 5 (Triangle)", col: 1, row: 3 },
        { label: "Tank/Ban Add 6 (Diamond)", col: 2, row: 3 },
        { label: "Tank/Ban Add 7 (Circle)", col: 3, row: 3 },
        { label: "Tank/Ban Add 8 (Star)", col: 4, row: 3 }
      ]
    },
    { boss: "Geddon", cols: 1, roles: [{ label: "Main Tank", col: 1, row: 1 }] },
    {
      boss: "Shazzrah",
      cols: 3,
      roles: [
        { label: "Main Tank", col: 1, row: 1 },
        { label: "Off Tank 1", col: 2, row: 1 },
        { label: "Off Tank 2", col: 3, row: 1 },
        ...healerColumn("Melee Healer", 1),
        ...healerColumn("Caster 1 Healer", 2),
        ...healerColumn("Caster 2 Healer", 3)
      ]
    },
    { boss: "Golemagg", cols: 3, roles: TANK_TRIO_WITH_MD },
    {
      boss: "Sulfuron",
      cols: 4,
      roles: [
        { label: "Main Tank", col: 1, row: 1 },
        { label: "Off Tank 1", col: 1, row: 2 },
        { label: "Off Tank 2", col: 2, row: 2 },
        { label: "Off Tank 3", col: 3, row: 2 },
        { label: "Off Tank 4", col: 4, row: 2 },
        { label: "Kick (Skull)", col: 1, row: 3 },
        { label: "Kick (Cross)", col: 2, row: 3 },
        { label: "Kick (Square)", col: 3, row: 3 },
        { label: "Kick (Moon)", col: 4, row: 3 }
      ]
    },
    {
      boss: "Majordomo",
      cols: 4,
      roles: [
        { label: "Main Tank", col: 1, row: 1 },
        { label: "Off Tank 1 (Skull)", col: 1, row: 2 },
        { label: "Off Tank 2 (Cross)", col: 2, row: 2 },
        { label: "Off Tank 3 (Square)", col: 3, row: 2 },
        { label: "Off Tank 4 (Moon)", col: 4, row: 2 },
        { label: "Sheep 1 (Triangle)", col: 1, row: 3 },
        { label: "Sheep 2 (Diamond)", col: 2, row: 3 },
        { label: "Sheep 3 (Circle)", col: 3, row: 3 },
        { label: "Sheep 4 (Star)", col: 4, row: 3 }
      ]
    },
    {
      boss: "Ragnaros",
      cols: 2,
      roles: [
        { label: "Main Tank", col: 1, row: 1 },
        { label: "Off Tank 1", col: 2, row: 1 }
      ]
    }
  ]
};
