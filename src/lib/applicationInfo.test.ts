import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { reapplyAvailableAt, isApplicationActive, REAPPLY_COOLDOWN_DAYS } from "./applicationInfo";

const NOW = new Date("2026-08-08T12:00:00Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("reapplyAvailableAt", () => {
  it("ajoute exactement le délai de cooldown en jours", () => {
    const reviewedAt = new Date("2026-01-01T00:00:00Z");
    const result = reapplyAvailableAt(reviewedAt);
    expect(result.getTime() - reviewedAt.getTime()).toBe(
      REAPPLY_COOLDOWN_DAYS * 24 * 60 * 60 * 1000
    );
  });
});

describe("isApplicationActive", () => {
  it("une candidature EN_ATTENTE est toujours active", () => {
    expect(isApplicationActive({ status: "EN_ATTENTE", reviewedAt: null })).toBe(true);
  });

  it("une candidature ACCEPTEE est toujours active", () => {
    expect(
      isApplicationActive({ status: "ACCEPTEE", reviewedAt: new Date("2020-01-01") })
    ).toBe(true);
  });

  it("une candidature REFUSEE sans date de traitement reste active", () => {
    expect(isApplicationActive({ status: "REFUSEE", reviewedAt: null })).toBe(true);
  });

  it("une candidature REFUSEE reste active pendant la fenêtre de cooldown", () => {
    // refusée il y a 10 jours, encore dans les 30 jours
    const reviewedAt = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000);
    expect(isApplicationActive({ status: "REFUSEE", reviewedAt })).toBe(true);
  });

  it("une candidature REFUSEE redevient inactive une fois le cooldown passé", () => {
    // refusée il y a 31 jours, cooldown de 30 jours dépassé
    const reviewedAt = new Date(NOW.getTime() - 31 * 24 * 60 * 60 * 1000);
    expect(isApplicationActive({ status: "REFUSEE", reviewedAt })).toBe(false);
  });
});
