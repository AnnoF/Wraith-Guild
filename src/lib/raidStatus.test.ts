import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { effectiveRaidStatus } from "./raidStatus";

// "now" fixé pour tous les tests : 2026-08-08T12:00:00Z
const NOW = new Date("2026-08-08T12:00:00Z");
const PAST = new Date("2026-08-01T12:00:00Z");
const FUTURE = new Date("2026-08-15T12:00:00Z");

type RaidLike = Parameters<typeof effectiveRaidStatus>[0];

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("effectiveRaidStatus", () => {
  it("ANNULE l'emporte même si la soirée est terminée", () => {
    const raid: RaidLike = { status: "ANNULE", endTime: PAST, signupDeadline: null };
    expect(effectiveRaidStatus(raid)).toBe("ANNULE");
  });

  it("une heure de fin de soirée passée devient TERMINE, même pour un statut OUVERT ou FERME", () => {
    expect(effectiveRaidStatus({ status: "OUVERT", endTime: PAST, signupDeadline: null })).toBe(
      "TERMINE"
    );
    expect(effectiveRaidStatus({ status: "FERME", endTime: PAST, signupDeadline: null })).toBe(
      "TERMINE"
    );
  });

  it("OUVERT avec une deadline d'inscription dépassée devient FERME", () => {
    const raid: RaidLike = { status: "OUVERT", endTime: FUTURE, signupDeadline: PAST };
    expect(effectiveRaidStatus(raid)).toBe("FERME");
  });

  it("OUVERT avec une deadline future reste OUVERT", () => {
    const raid: RaidLike = { status: "OUVERT", endTime: FUTURE, signupDeadline: FUTURE };
    expect(effectiveRaidStatus(raid)).toBe("OUVERT");
  });

  it("OUVERT sans deadline définie reste OUVERT tant que la soirée n'est pas terminée", () => {
    const raid: RaidLike = { status: "OUVERT", endTime: FUTURE, signupDeadline: null };
    expect(effectiveRaidStatus(raid)).toBe("OUVERT");
  });

  it("un statut FERME/TERMINE avec une fin de soirée future passe tel quel", () => {
    expect(effectiveRaidStatus({ status: "FERME", endTime: FUTURE, signupDeadline: null })).toBe(
      "FERME"
    );
    expect(effectiveRaidStatus({ status: "TERMINE", endTime: FUTURE, signupDeadline: null })).toBe(
      "TERMINE"
    );
  });
});
