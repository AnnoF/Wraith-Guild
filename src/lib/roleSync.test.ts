import { describe, it, expect } from "vitest";
import { resolveDiscordSiteRole } from "./roleSync";

describe("resolveDiscordSiteRole", () => {
  it("priorise Officier sur tout le reste", () => {
    expect(resolveDiscordSiteRole({ isOfficier: true, isMember: true, isSocial: true })).toBe("OFFICIER");
    expect(resolveDiscordSiteRole({ isOfficier: true, isMember: false, isSocial: false })).toBe("OFFICIER");
  });

  it("priorise Member sur Social quand pas Officier", () => {
    expect(resolveDiscordSiteRole({ isOfficier: false, isMember: true, isSocial: true })).toBe("MEMBER");
    expect(resolveDiscordSiteRole({ isOfficier: false, isMember: true, isSocial: false })).toBe("MEMBER");
  });

  it("retombe sur Social si seul ce rôle est présent", () => {
    expect(resolveDiscordSiteRole({ isOfficier: false, isMember: false, isSocial: true })).toBe("SOCIAL");
  });

  it("retombe sur Candidat si aucun rôle reconnu", () => {
    expect(resolveDiscordSiteRole({ isOfficier: false, isMember: false, isSocial: false })).toBe("CANDIDAT");
  });
});
