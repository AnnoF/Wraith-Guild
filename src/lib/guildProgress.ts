import { prisma } from "./prisma";

// Valeurs de repli utilisées uniquement pour amorcer la table au tout
// premier accès (avant qu'un Administrateur n'ait rien édité depuis
// GuildShowcase). Une fois la table peuplée, ces valeurs ne sont plus lues.
const DEFAULT_GUILD_PROGRESS = [
  { instance: "Molten Core", killed: 7, total: 10 },
  { instance: "Blackwing Lair", killed: 7, total: 8 },
  { instance: "Ahn'Qiraj Temple", killed: 8, total: 8 },
  { instance: "Naxxramas", killed: 13, total: 15 }
];

export async function getGuildProgress() {
  const entries = await prisma.guildProgressEntry.findMany({ orderBy: { order: "asc" } });
  if (entries.length > 0) return entries;

  await prisma.guildProgressEntry.createMany({
    data: DEFAULT_GUILD_PROGRESS.map((entry, index) => ({ ...entry, order: index }))
  });
  return prisma.guildProgressEntry.findMany({ orderBy: { order: "asc" } });
}
