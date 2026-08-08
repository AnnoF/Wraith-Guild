import { describe, it, expect } from "vitest";
import { RECRUITMENT_COLUMNS } from "./recruitment";
import { WOW_CLASSES } from "./classes";

describe("RECRUITMENT_COLUMNS", () => {
  it("chaque classe de WOW_CLASSES apparaît exactement une fois", () => {
    const allClasses = RECRUITMENT_COLUMNS.flatMap((col) => col.classes);
    expect(allClasses.sort()).toEqual([...WOW_CLASSES].sort());

    const counts = new Map<string, number>();
    for (const c of allClasses) {
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    for (const wowClass of WOW_CLASSES) {
      expect(counts.get(wowClass)).toBe(1);
    }
  });
});
