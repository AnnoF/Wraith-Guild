import { describe, it, expect } from "vitest";
import {
  isMainAltStatusLocked,
  availableMainAltStatuses,
  shouldAutoSelectAlt,
  canSetMainAltStatus,
  type MainAltStatus
} from "./mainAlt";

describe("isMainAltStatusLocked", () => {
  it("Main et Main Alt sont verrouillés une fois posés", () => {
    expect(isMainAltStatusLocked("MAIN")).toBe(true);
    expect(isMainAltStatusLocked("MAIN_ALT")).toBe(true);
  });

  it("Alt n'est jamais verrouillé", () => {
    expect(isMainAltStatusLocked("ALT")).toBe(false);
  });
});

describe("availableMainAltStatuses", () => {
  it("propose les trois choix quand aucun autre personnage n'a Main/Main Alt", () => {
    expect(availableMainAltStatuses([])).toEqual(["MAIN", "MAIN_ALT", "ALT"]);
  });

  it("retire Main si déjà pris par un autre personnage", () => {
    expect(availableMainAltStatuses(["MAIN"])).toEqual(["MAIN_ALT", "ALT"]);
  });

  it("retire Main Alt si déjà pris par un autre personnage", () => {
    expect(availableMainAltStatuses(["MAIN_ALT"])).toEqual(["MAIN", "ALT"]);
  });

  it("ne laisse que Alt quand Main et Main Alt sont déjà pris", () => {
    expect(availableMainAltStatuses(["MAIN", "MAIN_ALT"])).toEqual(["ALT"]);
  });

  it("Alt n'est jamais retiré même s'il est déjà pris par d'autres personnages", () => {
    expect(availableMainAltStatuses(["ALT", "ALT"])).toEqual(["MAIN", "MAIN_ALT", "ALT"]);
  });
});

describe("shouldAutoSelectAlt", () => {
  it("false tant qu'il manque Main ou Main Alt", () => {
    expect(shouldAutoSelectAlt([])).toBe(false);
    expect(shouldAutoSelectAlt(["MAIN"])).toBe(false);
    expect(shouldAutoSelectAlt(["MAIN_ALT"])).toBe(false);
  });

  it("true dès que Main et Main Alt sont tous les deux déjà pris", () => {
    expect(shouldAutoSelectAlt(["MAIN", "MAIN_ALT"])).toBe(true);
    expect(shouldAutoSelectAlt(["MAIN_ALT", "MAIN", "ALT"])).toBe(true);
  });
});

describe("canSetMainAltStatus", () => {
  it("Alt est toujours permis", () => {
    const siblings: MainAltStatus[] = ["MAIN", "MAIN_ALT", "ALT"];
    expect(canSetMainAltStatus("ALT", siblings)).toBe(true);
  });

  it("Main refusé si un autre personnage est déjà Main", () => {
    expect(canSetMainAltStatus("MAIN", ["MAIN"])).toBe(false);
  });

  it("Main Alt refusé si un autre personnage est déjà Main Alt", () => {
    expect(canSetMainAltStatus("MAIN_ALT", ["MAIN_ALT"])).toBe(false);
  });

  it("Main/Main Alt permis si aucun autre personnage ne les a pris", () => {
    expect(canSetMainAltStatus("MAIN", ["MAIN_ALT", "ALT"])).toBe(true);
    expect(canSetMainAltStatus("MAIN_ALT", ["MAIN", "ALT"])).toBe(true);
  });
});
