import { describe, it, expect } from "vitest";
import { instancesShareSize, programSummary, RAID_INSTANCE_SIZES } from "./raidInstances";

describe("instancesShareSize", () => {
  it("retourne true pour un tableau vide", () => {
    expect(instancesShareSize([])).toBe(true);
  });

  it("retourne true quand toutes les instances font la même taille", () => {
    // Les 3 instances actuelles ont chacune une taille différente : la seule
    // façon de partager une taille est de répéter la même instance.
    expect(instancesShareSize(["Onyxia's Lair", "Onyxia's Lair"])).toBe(true);
    expect(RAID_INSTANCE_SIZES["Onyxia's Lair"]).toBe(40);
  });

  it("retourne true pour une seule instance", () => {
    expect(instancesShareSize(["Hyjal Summit"])).toBe(true);
  });

  it("retourne false quand les tailles sont mélangées (40 et 20)", () => {
    expect(instancesShareSize(["Onyxia's Lair", "Hyjal Summit"])).toBe(false);
  });

  it("retourne false dès qu'un titre est inconnu, même répété deux fois", () => {
    // Une taille inconnue ne doit jamais être supposée "identique" à une
    // autre taille inconnue — seuls des titres reconnus par
    // RAID_INSTANCE_SIZES peuvent partager une taille.
    expect(instancesShareSize(["Bogus 1", "Bogus 2"])).toBe(false);
    expect(instancesShareSize(["Bogus", "Bogus"])).toBe(false);
  });

  it("un mélange instance connue + inconnue est considéré comme des tailles différentes", () => {
    expect(instancesShareSize(["Onyxia's Lair", "Bogus"])).toBe(false);
  });
});

describe("programSummary", () => {
  it("joint les instances d'une phase avec ' + '", () => {
    expect(programSummary([{ runs: [{ title: "Barrow Deeps" }, { title: "Onyxia's Lair" }] }])).toBe(
      "Barrow Deeps + Onyxia's Lair"
    );
  });

  it("regroupe les instances répétées d'une même phase avec ' ×N'", () => {
    expect(programSummary([{ runs: [{ title: "Hyjal Summit" }, { title: "Hyjal Summit" }] }])).toBe(
      "Hyjal Summit ×2"
    );
  });

  it("joint les phases successives avec ' → '", () => {
    expect(
      programSummary([
        { runs: [{ title: "Onyxia's Lair" }] },
        { runs: [{ title: "Hyjal Summit" }, { title: "Hyjal Summit" }] }
      ])
    ).toBe("Onyxia's Lair → Hyjal Summit ×2");
  });

  it("retourne une chaîne vide pour un tableau de phases vide", () => {
    expect(programSummary([])).toBe("");
  });
});
