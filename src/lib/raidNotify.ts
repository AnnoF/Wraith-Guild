// Alerte Discord quand un Officier ferme les inscriptions d'un raid (la
// composition est considérée figée à ce moment). Envoyée via un webhook
// de canal dédié (DISCORD_RAID_WEBHOOK_URL) avec un ping des rôles
// Raideur/Officier configurés. N'échoue jamais bruyamment : une panne ne
// doit pas empêcher le changement de statut d'être enregistré.
import { getRoleIdByName } from "./discord";
import { raidTitleLabel } from "./raidInstances";

function raidUrl(id: string) {
  const base = process.env.NEXTAUTH_URL || "";
  return `${base}/raids/${id}`;
}

export async function notifyRaidLocked(raid: { id: string; titles: string[]; date: Date | string }) {
  const url = process.env.DISCORD_RAID_WEBHOOK_URL;
  if (!url) return;

  const roleIds: string[] = [];
  try {
    const [raideurId, officierId] = await Promise.all([
      getRoleIdByName(process.env.DISCORD_ROLE_RAIDEUR || "Raideur"),
      getRoleIdByName(process.env.DISCORD_ROLE_OFFICIER || "Officier")
    ]);
    if (raideurId) roleIds.push(raideurId);
    if (officierId) roleIds.push(officierId);
  } catch (err) {
    console.error("Erreur résolution rôles Discord (alerte raid) :", err);
  }

  const mentions = roleIds.map((id) => `<@&${id}>`).join(" ");
  const dateLabel = new Date(raid.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit"
  });

  const content = `🔒 ${mentions ? mentions + " — " : ""}Les inscriptions pour **${raidTitleLabel(raid.titles)}** (${dateLabel}) sont closes, la composition est prête.\n${raidUrl(raid.id)}`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        // Liste blanche explicite : seuls ces rôles peuvent être pingés,
        // rien d'autre n'est interprété dans le message.
        allowed_mentions: { roles: roleIds }
      })
    });
  } catch (err) {
    console.error("Erreur webhook Discord (verrouillage raid) :", err);
  }
}
