import { describe, it, expect } from "vitest";
import { RAID_BOSS_ROLES } from "./bossRoles";

describe("RAID_BOSS_ROLES", () => {
  for (const [raidTitle, bosses] of Object.entries(RAID_BOSS_ROLES)) {
    describe(raidTitle, () => {
      for (const boss of bosses) {
        it(`${boss.boss} : pas de label en double`, () => {
          const labels = boss.roles.map((r) => r.label);
          expect(new Set(labels).size).toBe(labels.length);
        });

        it(`${boss.boss} : pas de position (col, row) en double`, () => {
          const positions = boss.roles.map((r) => `${r.col}:${r.row}`);
          expect(new Set(positions).size).toBe(positions.length);
        });

        it(`${boss.boss} : chaque rôle respecte le nombre de colonnes déclaré`, () => {
          for (const role of boss.roles) {
            expect(role.col).toBeGreaterThanOrEqual(1);
            expect(role.col).toBeLessThanOrEqual(boss.cols);
          }
        });
      }
    });
  }
});
