import { describe, it, expect } from "vitest";
import { groupByColumn, RECRUITMENT_PRIORITIES } from "./recruitment";
import { WOW_CLASSES } from "./classes";
import type { RecruitmentPriority } from "@prisma/client";

describe("groupByColumn", () => {
  it("chaque classe apparaît exactement une fois, dans la bonne colonne", () => {
    const status = Object.fromEntries(
      WOW_CLASSES.map((wowClass, i) => [wowClass, RECRUITMENT_PRIORITIES[i % RECRUITMENT_PRIORITIES.length]])
    ) as Record<(typeof WOW_CLASSES)[number], RecruitmentPriority>;

    const columns = groupByColumn(status);
    const allClasses = columns.flatMap((col) => col.classes);
    expect(allClasses.sort()).toEqual([...WOW_CLASSES].sort());

    for (const col of columns) {
      for (const wowClass of col.classes) {
        expect(status[wowClass]).toBe(col.priority);
      }
    }
  });
});
