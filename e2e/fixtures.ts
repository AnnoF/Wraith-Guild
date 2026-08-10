import { test as base, expect } from "@playwright/test";
import type { SiteRole, User } from "@prisma/client";
import { createUser, prisma } from "./helpers/db";
import { signInAs as mintSessionCookie } from "./helpers/session";

interface Fixtures {
  // Crée un utilisateur du rôle demandé et pose son cookie de session sur le
  // contexte du test avant toute navigation. Renvoie l'utilisateur créé (id,
  // discordTag...) pour que le test puisse l'utiliser (assertions, seed
  // complémentaire via `prisma`...).
  signInAs: (role: SiteRole, discordTag?: string) => Promise<User>;
}

export const test = base.extend<Fixtures>({
  signInAs: async ({ context }, use) => {
    await use(async (role, discordTag) => {
      const user = await createUser(role, discordTag);
      await mintSessionCookie(context, user);
      return user;
    });
  }
});

export { expect, prisma };
