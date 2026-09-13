import { describe, it, expect } from "vitest";
import { groupRows } from "./raidGroups";

describe("groupRows", () => {
  it("cas spécial 25-man : 2 groupes puis 3, quel que soit numGroups", () => {
    expect(groupRows(25, 5)).toEqual([[0, 1], [2, 3, 4]]);
  });

  it("cas générique : numGroups multiple de 4 -> lignes complètes de 4", () => {
    // Onyxia's Lair (40 joueurs, 8 groupes)
    expect(groupRows(40, 8)).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7]
    ]);
  });

  it("cas générique : dernière ligne partielle quand numGroups n'est pas multiple de 4", () => {
    // Hyjal Summit (20 joueurs, 4 groupes) -> une seule ligne pleine
    expect(groupRows(20, 4)).toEqual([[0, 1, 2, 3]]);
    // 6 groupes -> une ligne de 4 puis une ligne de 2
    expect(groupRows(10, 6)).toEqual([[0, 1, 2, 3], [4, 5]]);
  });

  it("un seul groupe donne une seule ligne à un élément", () => {
    expect(groupRows(5, 1)).toEqual([[0]]);
  });
});
