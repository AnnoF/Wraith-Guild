import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Depuis Prisma 7, la connexion passe par un adaptateur de pilote (pg).
// connectionTimeoutMillis reproduit le délai de 5 s de Prisma 6 : le pilote pg
// n'en impose aucun par défaut, une base injoignable ferait donc pendre les requêtes.
function createClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000
  });
  return new PrismaClient({ adapter });
}

// Évite de recréer une connexion à chaque hot-reload en développement
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
