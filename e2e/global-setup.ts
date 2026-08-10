import type { FullConfig } from "@playwright/test";
import { prisma, resetDb } from "./helpers/db";

// Garde-fou volontairement strict : cette suite vide entièrement les tables
// applicatives avant chaque run. Si DATABASE_URL ne pointe pas vers la base
// de test dédiée (wraithguild_test sur le VPS, jamais wraithguild), on
// s'arrête plutôt que de risquer de vider la mauvaise base.
export default async function globalSetup(_config: FullConfig) {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("wraithguild_test")) {
    throw new Error(
      "DATABASE_URL ne pointe pas vers wraithguild_test — vérifiez .env.test avant de lancer les tests E2E (voir e2e/README.md)."
    );
  }

  await resetDb();
  await prisma.$disconnect();
}
