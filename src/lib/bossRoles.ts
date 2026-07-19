// Rôles spécifiques par boss, pour le "mode avancé" de la composition.
// Défini par titre de raid ; un raid sans entrée ici n'a pas de mode
// avancé disponible (affiche un message d'attente).

export interface BossRoles {
  boss: string;
  roles: string[];
}

function group(label: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => `${label} ${i + 1}`);
}

const TANK_TRIO_WITH_MD = [
  "Main Tank",
  "Off Tank 1",
  "Off Tank 2",
  "Misdirection 1 (→ Off Tank 1)",
  "Misdirection 2 (→ Off Tank 2)"
];

export const RAID_BOSS_ROLES: Record<string, BossRoles[]> = {
  "Molten Core": [
    { boss: "Lucifron", roles: TANK_TRIO_WITH_MD },
    { boss: "Magmadar", roles: ["Main Tank"] },
    { boss: "Gehennas", roles: TANK_TRIO_WITH_MD },
    {
      boss: "Garr",
      roles: [
        "Main Tank",
        "Tank/Ban Add 1 (Skull)",
        "Tank/Ban Add 2 (Cross)",
        "Tank/Ban Add 3 (Square)",
        "Tank/Ban Add 4 (Moon)",
        "Tank/Ban Add 5 (Triangle)",
        "Tank/Ban Add 6 (Diamond)",
        "Tank/Ban Add 7 (Circle)",
        "Tank/Ban Add 8 (Star)"
      ]
    },
    { boss: "Geddon", roles: ["Main Tank"] },
    {
      boss: "Shazzrah",
      roles: [
        "Main Tank",
        "Off Tank 1",
        "Off Tank 2",
        ...group("Melee Healer Group", 5),
        ...group("Caster 1 Healer Group", 5),
        ...group("Caster 2 Healer Group", 5)
      ]
    },
    { boss: "Golemagg", roles: TANK_TRIO_WITH_MD },
    {
      boss: "Sulfuron",
      roles: [
        "Main Tank",
        "Off Tank 1",
        "Off Tank 2",
        "Off Tank 3",
        "Off Tank 4",
        "Kick (Skull)",
        "Kick (Cross)",
        "Kick (Square)",
        "Kick (Moon)"
      ]
    },
    {
      boss: "Majordomo",
      roles: [
        "Main Tank",
        "Off Tank 1 (Skull)",
        "Off Tank 2 (Cross)",
        "Off Tank 3 (Square)",
        "Off Tank 4 (Moon)",
        "Sheep 1 (Triangle)",
        "Sheep 2 (Diamond)",
        "Sheep 3 (Circle)",
        "Sheep 4 (Star)"
      ]
    },
    { boss: "Ragnaros", roles: ["Main Tank", "Off Tank 1"] }
  ]
};
