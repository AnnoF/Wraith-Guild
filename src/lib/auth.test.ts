import { describe, it, expect, vi } from "vitest";

// auth.ts importe "./prisma" à son niveau module, qui instancie un
// PrismaClient au chargement — ça échouerait sans DATABASE_URL définie
// dans l'environnement de test. On mocke ce module avant l'import pour ne
// tester que les helpers de rôles, purs et sans dépendance à Prisma.
// (@/lib/discord et next-auth/providers/discord n'ont pas d'effet de bord
// au chargement du module, donc pas besoin de les mocker ici.)
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

const { canConfigureRaids, canManageRoles, isMember } = await import("./auth");

describe("canConfigureRaids", () => {
  it("autorise OFFICIER et ADMINISTRATEUR", () => {
    expect(canConfigureRaids("OFFICIER")).toBe(true);
    expect(canConfigureRaids("ADMINISTRATEUR")).toBe(true);
  });

  it("refuse RAIDEUR, CANDIDAT et l'absence de rôle", () => {
    expect(canConfigureRaids("RAIDEUR")).toBe(false);
    expect(canConfigureRaids("CANDIDAT")).toBe(false);
    expect(canConfigureRaids(undefined)).toBe(false);
  });
});

describe("canManageRoles", () => {
  it("autorise uniquement ADMINISTRATEUR", () => {
    expect(canManageRoles("ADMINISTRATEUR")).toBe(true);
    expect(canManageRoles("OFFICIER")).toBe(false);
    expect(canManageRoles("RAIDEUR")).toBe(false);
    expect(canManageRoles("CANDIDAT")).toBe(false);
    expect(canManageRoles(undefined)).toBe(false);
  });
});

describe("isMember", () => {
  it("refuse CANDIDAT et l'absence de rôle", () => {
    expect(isMember("CANDIDAT")).toBe(false);
    expect(isMember(undefined)).toBe(false);
  });

  it("autorise RAIDEUR, OFFICIER et ADMINISTRATEUR", () => {
    expect(isMember("RAIDEUR")).toBe(true);
    expect(isMember("OFFICIER")).toBe(true);
    expect(isMember("ADMINISTRATEUR")).toBe(true);
  });
});
