// Contenu éditorial de la page vitrine, centralisé ici pour être mis à
// jour facilement sans toucher aux composants (progression de guilde,
// lien Discord, textes du hero...).

export const DISCORD_INVITE_URL = "https://discord.gg/REMPLACER-MOI";

export const GUILD_FOUNDED_YEAR = 2019;
export const GUILD_TAGLINE = "La Horde ne pardonne pas.";
export const GUILD_SUBTITLE = "Guilde PvE · Raids 40 joueurs · Communauté adulte";

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

export interface GuildValue {
  label: string;
  description: string;
}

export const GUILD_VALUES: GuildValue[] = [
  { label: "Respect", description: "Envers tous les membres, quel que soit leur niveau." },
  { label: "Régularité", description: "Une présence fiable, semaine après semaine." },
  { label: "Entraide", description: "On progresse ensemble, pas les uns contre les autres." },
  { label: "Bonne humeur", description: "On joue pour se retrouver, pas pour se prendre au sérieux." }
];
