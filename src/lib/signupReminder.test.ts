import { describe, expect, it } from "vitest";
import { chunkLines, findMissingUsers, isReminderDue } from "./signupReminder";

const h = (n: number) => n * 3600 * 1000;
const now = new Date("2026-10-10T12:00:00Z");
const base = { status: "OUVERT", signupReminderSentAt: null };

describe("isReminderDue", () => {
  it("est dû dans les 12 h avant la date limite", () => {
    expect(isReminderDue({ ...base, signupDeadline: new Date(now.getTime() + h(11)) }, now)).toBe(true);
    expect(isReminderDue({ ...base, signupDeadline: new Date(now.getTime() + h(12)) }, now)).toBe(true);
  });
  it("n'est pas dû trop tôt, trop tard, ou déjà envoyé", () => {
    expect(isReminderDue({ ...base, signupDeadline: new Date(now.getTime() + h(13)) }, now)).toBe(false);
    expect(isReminderDue({ ...base, signupDeadline: new Date(now.getTime() - h(1)) }, now)).toBe(false);
    expect(
      isReminderDue({ ...base, signupDeadline: new Date(now.getTime() + h(5)), signupReminderSentAt: now }, now)
    ).toBe(false);
  });
  it("ignore les raids sans date limite ou non ouverts", () => {
    expect(isReminderDue({ ...base, signupDeadline: null }, now)).toBe(false);
    expect(
      isReminderDue({ ...base, status: "FERME", signupDeadline: new Date(now.getTime() + h(5)) }, now)
    ).toBe(false);
  });
});

describe("findMissingUsers", () => {
  const mk = (id: string, vacationStart: Date | null = null, vacationEnd: Date | null = null) => ({
    id,
    vacationStart,
    vacationEnd
  });
  const raidDate = new Date("2026-10-11T19:00:00Z");
  it("exclut les répondants et les personnes en vacances", () => {
    const users = [
      mk("a"),
      mk("b"),
      mk("c", new Date("2026-10-09T00:00:00Z"), new Date("2026-10-20T00:00:00Z")),
      mk("d", new Date("2026-09-01T00:00:00Z"), new Date("2026-09-10T00:00:00Z"))
    ];
    expect(findMissingUsers(users, new Set(["b"]), raidDate).map((u) => u.id)).toEqual(["a", "d"]);
  });
});

describe("chunkLines", () => {
  it("découpe sous la limite", () => {
    const msgs = chunkLines("H", Array.from({ length: 50 }, (_, i) => "x".repeat(50) + i), 500);
    expect(msgs.length).toBeGreaterThan(1);
    expect(msgs.every((m) => m.length <= 500)).toBe(true);
  });
});
