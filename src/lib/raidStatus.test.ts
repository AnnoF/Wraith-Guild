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
  it("ANNULE l'emporte même si la date du raid est passée", () => {
    const raid: RaidLike = { status: "ANNULE", date: PAST, signupDeadline: null };
    expect(effectiveRaidStatus(raid)).toBe("ANNULE");
  });

  it("une date de raid passée devient TERMINE, même pour un statut OUVERT ou FERME", () => {
    expect(effectiveRaidStatus({ status: "OUVERT", date: PAST, signupDeadline: null })).toBe(
      "TERMINE"
    );
    expect(effectiveRaidStatus({ status: "FERME", date: PAST, signupDeadline: null })).toBe(
      "TERMINE"
    );
  });

  it("OUVERT avec une deadline d'inscription dépassée devient FERME", () => {
    const raid: RaidLike = { status: "OUVERT", date: FUTURE, signupDeadline: PAST };
    expect(effectiveRaidStatus(raid)).toBe("FERME");
  });

  it("OUVERT avec une deadline future reste OUVERT", () => {
    const raid: RaidLike = { status: "OUVERT", date: FUTURE, signupDeadline: FUTURE };
    expect(effectiveRaidStatus(raid)).toBe("OUVERT");
  });

  it("OUVERT sans deadline définie reste OUVERT tant que la date n'est pas passée", () => {
    const raid: RaidLike = { status: "OUVERT", date: FUTURE, signupDeadline: null };
    expect(effectiveRaidStatus(raid)).toBe("OUVERT");
  });

  it("un statut FERME/TERMINE avec une date future passe tel quel", () => {
    expect(effectiveRaidStatus({ status: "FERME", date: FUTURE, signupDeadline: null })).toBe(
      "FERME"
    );
    expect(effectiveRaidStatus({ status: "TERMINE", date: FUTURE, signupDeadline: null })).toBe(
      "TERMINE"
    );
  });
});
