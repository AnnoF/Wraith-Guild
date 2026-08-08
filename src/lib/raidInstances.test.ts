import { describe, it, expect } from "vitest";
import { instancesShareSize, raidTitleLabel, RAID_INSTANCE_SIZES } from "./raidInstances";

describe("instancesShareSize", () => {
  it("retourne true pour un tableau vide", () => {
    expect(instancesShareSize([])).toBe(true);
  });

  it("retourne true quand toutes les instances font la même taille", () => {
    expect(instancesShareSize(["Molten Core", "Onyxia's Lair"])).toBe(true);
    expect(RAID_INSTANCE_SIZES["Molten Core"]).toBe(40);
    expect(RAID_INSTANCE_SIZES["Onyxia's Lair"]).toBe(40);
  });

  it("retourne true pour une seule instance", () => {
    expect(instancesShareSize(["Zul'Gurub"])).toBe(true);
  });

  it("retourne false quand les tailles sont mélangées (40 et 20)", () => {
    expect(instancesShareSize(["Molten Core", "Zul'Gurub"])).toBe(false);
  });

  it("comportement actuel documenté : des titres inconnus s'effondrent en un seul undefined", () => {
    // RAID_INSTANCE_SIZES[titreInconnu] vaut `undefined` pour les deux titres,
    // donc le Set n'a qu'un seul élément (`undefined`) et la fonction répond true.
    // Ce n'est pas la correction d'un bug, seulement la fixation du comportement existant.
    expect(instancesShareSize(["Bogus 1", "Bogus 2"])).toBe(true);
  });

  it("un mélange instance connue + inconnue est considéré comme des tailles différentes", () => {
    expect(instancesShareSize(["Molten Core", "Bogus"])).toBe(false);
  });
});

describe("raidTitleLabel", () => {
  it("joint les titres avec ' + '", () => {
    expect(raidTitleLabel(["Molten Core", "Onyxia's Lair"])).toBe("Molten Core + Onyxia's Lair");
  });

  it("retourne le titre seul s'il n'y en a qu'un", () => {
    expect(raidTitleLabel(["Molten Core"])).toBe("Molten Core");
  });

  it("retourne une chaîne vide pour un tableau vide", () => {
    expect(raidTitleLabel([])).toBe("");
  });
});
