import { describe, it, expect } from "vitest";
import { PROFESSIONS, PROFESSION_LABELS, MAX_PROFESSIONS_PER_CHARACTER } from "./professions";

describe("professions", () => {
  it("chaque métier a un libellé", () => {
    for (const profession of PROFESSIONS) {
      expect(PROFESSION_LABELS[profession]).toBeTruthy();
    }
  });

  it("n'a pas de libellé orphelin en trop", () => {
    expect(Object.keys(PROFESSION_LABELS).sort()).toEqual([...PROFESSIONS].sort());
  });

  it("limite les métiers par personnage à 2", () => {
    expect(MAX_PROFESSIONS_PER_CHARACTER).toBe(2);
  });
});
