import { describe, it, expect } from "vitest";
import { getWowWeekRange } from "./wowWeek";

// Ces tests supposent TZ=Europe/Paris (fixé par le script npm "test" via
// cross-env), pour que les calculs de minuit local soient déterministes.

describe("getWowWeekRange", () => {
  it("pour un mercredi, start = ce mercredi à minuit local", () => {
    // 2026-08-05 est un mercredi
    const { start, end } = getWowWeekRange("2026-08-05T15:30:00");
    expect(start.getFullYear()).toBe(2026);
    expect(start.getMonth()).toBe(7); // août = index 7
    expect(start.getDate()).toBe(5);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
    expect(start.getMilliseconds()).toBe(0);
  });

  it("l'intervalle se termine le mardi suivant à 23:59:59.999", () => {
    const { end } = getWowWeekRange("2026-08-05T15:30:00");
    expect(end.getDate()).toBe(11); // mardi 11 août 2026
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it("pour un autre jour de la semaine, start recule jusqu'au mercredi précédent", () => {
    // 2026-08-09 est un dimanche ; le mercredi précédent est le 5 août
    const { start } = getWowWeekRange("2026-08-09T10:00:00");
    expect(start.getDate()).toBe(5);
    expect(start.getMonth()).toBe(7);
  });

  it("une date qui tombe un mardi appartient à la semaine qui se termine ce jour-là", () => {
    // 2026-08-11 est un mardi, dernier jour de la semaine commencée le 5 août
    const { start, end } = getWowWeekRange("2026-08-11T23:00:00");
    expect(start.getDate()).toBe(5);
    expect(end.getDate()).toBe(11);
  });

  it("l'intervalle dure exactement 7 jours moins 1 milliseconde", () => {
    const { start, end } = getWowWeekRange("2026-08-05T15:30:00");
    expect(end.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000 - 1);
  });

  it("accepte un objet Date en entrée, pas seulement une chaîne", () => {
    const { start } = getWowWeekRange(new Date("2026-08-05T15:30:00"));
    expect(start.getDate()).toBe(5);
  });
});
