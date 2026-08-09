import { describe, it, expect } from "vitest";
import { allSpecs, groupByColumn, RECRUITMENT_PRIORITIES, specKey } from "./recruitment";
import type { RecruitmentPriority } from "@prisma/client";

describe("groupByColumn", () => {
  it("chaque spécialisation apparaît exactement une fois, dans la bonne colonne", () => {
    const specs = allSpecs();
    const status: Record<string, RecruitmentPriority> = {};
    specs.forEach(({ wowClass, spec }, i) => {
      status[specKey(wowClass, spec)] = RECRUITMENT_PRIORITIES[i % RECRUITMENT_PRIORITIES.length];
    });

    const columns = groupByColumn(status);
    const allListed = columns.flatMap((col) => col.specs.map(({ wowClass, spec }) => specKey(wowClass, spec)));
    expect(allListed.sort()).toEqual(specs.map(({ wowClass, spec }) => specKey(wowClass, spec)).sort());

    for (const col of columns) {
      for (const { wowClass, spec } of col.specs) {
        expect(status[specKey(wowClass, spec)]).toBe(col.priority);
      }
    }
  });
});
