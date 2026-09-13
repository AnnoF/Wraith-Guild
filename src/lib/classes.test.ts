import { describe, it, expect } from "vitest";
import {
  WOW_CLASSES,
  CLASS_LABELS,
  CLASS_SPECS,
  CLASS_COLORS,
  classSpecIconPath,
  guessRaidRole
} from "./classes";

describe("classSpecIconPath", () => {
  it("remplace les espaces par des underscores pour les spés multi-mots", () => {
    expect(classSpecIconPath("DRUIDE", "Feral Bear")).toBe(
      "/icons/classes/Druid_Feral_Bear.png"
    );
    expect(classSpecIconPath("CHASSEUR", "Beast Mastery")).toBe(
      "/icons/classes/Hunter_Beast_Mastery.png"
    );
  });

  it("construit le chemin classe_spé pour une spé simple", () => {
    expect(classSpecIconPath("MAGE", "Fire")).toBe("/icons/classes/Mage_Fire.png");
  });

  it("fonctionne pour chaque classe connue", () => {
    for (const wowClass of WOW_CLASSES) {
      const [spec] = CLASS_SPECS[wowClass];
      expect(classSpecIconPath(wowClass, spec)).toBe(
        `/icons/classes/${CLASS_LABELS[wowClass].replace(/ /g, "_")}_${spec.replace(/ /g, "_")}.png`
      );
    }
  });
});

describe("guessRaidRole", () => {
  it("mappe Protection sur TANK pour Guerrier ET Paladin (collision documentée)", () => {
    expect(guessRaidRole("GUERRIER", "Protection")).toBe("TANK");
    expect(guessRaidRole("PALADIN", "Protection")).toBe("TANK");
  });

  it("mappe Holy sur SOIGNEUR pour Prêtre ET Paladin (collision documentée)", () => {
    expect(guessRaidRole("PRETRE", "Holy")).toBe("SOIGNEUR");
    expect(guessRaidRole("PALADIN", "Holy")).toBe("SOIGNEUR");
  });

  it("mappe Feral Bear sur TANK et Restoration sur SOIGNEUR", () => {
    expect(guessRaidRole("DRUIDE", "Feral Bear")).toBe("TANK");
    expect(guessRaidRole("DRUIDE", "Restoration")).toBe("SOIGNEUR");
    expect(guessRaidRole("CHAMAN", "Restoration")).toBe("SOIGNEUR");
  });

  it("reconnaît les anciens noms de spé en français", () => {
    expect(guessRaidRole("PALADIN", "Sacré")).toBe("SOIGNEUR");
    expect(guessRaidRole("PALADIN", "Sainteté")).toBe("SOIGNEUR");
    expect(guessRaidRole("DRUIDE", "Restauration")).toBe("SOIGNEUR");
  });

  it("retombe sur DPS pour une spé inconnue ou vide", () => {
    expect(guessRaidRole("VOLEUR", "Assassination")).toBe("DPS");
    expect(guessRaidRole("MAGE", "")).toBe("DPS");
    expect(guessRaidRole("GUERRIER", "Spé Inexistante")).toBe("DPS");
  });
});

describe("cohérence des tables de classes", () => {
  it("chaque classe a un libellé, des spés et une couleur", () => {
    for (const wowClass of WOW_CLASSES) {
      expect(CLASS_LABELS[wowClass]).toBeTruthy();
      expect(CLASS_SPECS[wowClass].length).toBeGreaterThan(0);
      expect(CLASS_COLORS[wowClass]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
