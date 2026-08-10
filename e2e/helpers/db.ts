import { PrismaClient, type SiteRole, type User } from "@prisma/client";

export const prisma = new PrismaClient();

// Ordre sans importance pour TRUNCATE ... CASCADE, mais explicite pour
// documenter les tables couvertes par le reset E2E.
const TABLES = [
  "RoleAudit",
  "ApplicationComment",
  "Application",
  "BossRoleAssignment",
  "RaidSignup",
  "Raid",
  "CharacterProfession",
  "Character",
  "RecruitmentStatus",
  "GuildProgressEntry",
  "HallOfFameEntry",
  "GuideEntry",
  "User"
];

export async function resetDb() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`);
}

let counter = 0;
function uniqueSuffix() {
  counter += 1;
  return `${Date.now()}-${counter}`;
}

export async function createUser(role: SiteRole, discordTag?: string): Promise<User> {
  const suffix = uniqueSuffix();
  return prisma.user.create({
    data: {
      discordId: `e2e-${suffix}`,
      discordTag: discordTag ?? `${role}-${suffix}`,
      siteRole: role
    }
  });
}
