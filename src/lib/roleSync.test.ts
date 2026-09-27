import { describe, it, expect } from "vitest";
import { resolveDiscordSiteRole } from "./roleSync";

describe("resolveDiscordSiteRole", () => {
  it("priorise Officier sur tout le reste", () => {
    expect(
      resolveDiscordSiteRole({ isOfficier: true, isMember: true, isApply: true, isSocial: true })
    ).toBe("OFFICIER");
    expect(
      resolveDiscordSiteRole({ isOfficier: true, isMember: false, isApply: false, isSocial: false })
    ).toBe("OFFICIER");
  });

  it("priorise Member sur Apply et Social quand pas Officier", () => {
    expect(
      resolveDiscordSiteRole({ isOfficier: false, isMember: true, isApply: true, isSocial: true })
    ).toBe("MEMBER");
    expect(
      resolveDiscordSiteRole({ isOfficier: false, isMember: true, isApply: false, isSocial: false })
    ).toBe("MEMBER");
  });

  it("priorise Apply sur Social quand pas Officier ni Member", () => {
    expect(
      resolveDiscordSiteRole({ isOfficier: false, isMember: false, isApply: true, isSocial: true })
    ).toBe("APPLY");
    expect(
      resolveDiscordSiteRole({ isOfficier: false, isMember: false, isApply: true, isSocial: false })
    ).toBe("APPLY");
  });

  it("retombe sur Social si seul ce rôle est présent", () => {
    expect(
      resolveDiscordSiteRole({ isOfficier: false, isMember: false, isApply: false, isSocial: true })
    ).toBe("SOCIAL");
  });

  it("retombe sur Candidat si aucun rôle reconnu", () => {
    expect(
      resolveDiscordSiteRole({ isOfficier: false, isMember: false, isApply: false, isSocial: false })
    ).toBe("CANDIDAT");
  });
});
