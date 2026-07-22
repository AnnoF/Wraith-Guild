// Aide à vérifier les rôles Discord d'un membre côté serveur, via un bot.
// Nécessite un bot Discord ajouté au serveur de guilde avec l'intent
// "Server Members" activé, et le token placé dans DISCORD_BOT_TOKEN.

const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordMember {
  roles: string[]; // IDs des rôles
  user: { id: string; username: string; avatar: string | null };
}

export async function fetchGuildMember(discordUserId: string): Promise<DiscordMember | null> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !botToken) {
    throw new Error("DISCORD_GUILD_ID ou DISCORD_BOT_TOKEN manquant dans .env");
  }

  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/members/${discordUserId}`, {
    headers: { Authorization: `Bot ${botToken}` },
    cache: "no-store"
  });

  if (res.status === 404) return null; // pas membre du serveur
  if (!res.ok) throw new Error(`Erreur API Discord: ${res.status}`);

  return res.json();
}

// Résout les noms de rôles configurés (.env) en IDs de rôle Discord,
// puis vérifie si le membre les possède. Les IDs sont mis en cache mémoire
// (courte durée) pour éviter d'appeler l'API Discord à chaque requête.
let roleCache: { map: Record<string, string>; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getRoleIdByName(name: string): Promise<string | null> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!roleCache || Date.now() - roleCache.fetchedAt > CACHE_TTL_MS) {
    const res = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`Erreur API Discord (roles): ${res.status}`);
    const roles: { id: string; name: string }[] = await res.json();
    roleCache = {
      map: Object.fromEntries(roles.map((r) => [r.name, r.id])),
      fetchedAt: Date.now()
    };
  }
  return roleCache.map[name] ?? null;
}

export async function memberHasRole(member: DiscordMember, roleName: string): Promise<boolean> {
  const roleId = await getRoleIdByName(roleName);
  if (!roleId) return false;
  return member.roles.includes(roleId);
}

// Nombre approximatif de membres du serveur Discord, pour le bandeau de
// stats de la page vitrine. Mis en cache (même durée que roleCache) et ne
// throw jamais : une panne de l'API Discord ne doit pas casser la page
// publique, la tuile correspondante est simplement masquée (voir
// GuildShowcase).
let memberCountCache: { count: number; fetchedAt: number } | null = null;

export async function fetchApproxMemberCount(): Promise<number | null> {
  const guildId = process.env.DISCORD_GUILD_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!guildId || !botToken) return null;

  if (memberCountCache && Date.now() - memberCountCache.fetchedAt < CACHE_TTL_MS) {
    return memberCountCache.count;
  }

  try {
    const res = await fetch(`${DISCORD_API}/guilds/${guildId}?with_counts=true`, {
      headers: { Authorization: `Bot ${botToken}` },
      cache: "no-store"
    });
    if (!res.ok) return memberCountCache?.count ?? null;
    const data = await res.json();
    const count = data.approximate_member_count;
    if (typeof count !== "number") return memberCountCache?.count ?? null;
    memberCountCache = { count, fetchedAt: Date.now() };
    return count;
  } catch {
    return memberCountCache?.count ?? null;
  }
}
