// Contenu éditorial de la page vitrine, centralisé ici pour être mis à
// jour facilement sans toucher aux composants (progression de guilde,
// lien Discord...).

export const DISCORD_INVITE_URL = "https://discord.gg/REMPLACER-MOI";

export interface GuildProgressEntry {
  instance: string;
  killed: number;
  total: number;
}

export const GUILD_PROGRESS: GuildProgressEntry[] = [
  { instance: "Molten Core", killed: 7, total: 10 },
  { instance: "Blackwing Lair", killed: 7, total: 8 },
  { instance: "Ahn'Qiraj Temple", killed: 8, total: 8 },
  { instance: "Naxxramas", killed: 13, total: 15 }
];
