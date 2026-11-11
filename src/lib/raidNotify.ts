// Alerte Discord quand un Officier ferme les inscriptions d'un raid (la
// composition est considérée figée à ce moment). Envoyée via un webhook
// de canal dédié (DISCORD_RAID_WEBHOOK_URL) avec un ping @everyone.
// N'échoue jamais bruyamment : une panne ne doit pas empêcher le
// changement de statut d'être enregistré.

function raidUrl(id: string) {
  const base = process.env.NEXTAUTH_URL || "";
  return `${base}/raids/${id}`;
}

export async function notifyRaidLocked(raid: { id: string; name: string; date: Date | string }) {
  const url = process.env.DISCORD_RAID_WEBHOOK_URL;
  if (!url) return;

  const dateLabel = new Date(raid.date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris"
  });

  const content = `🔒 @everyone — Les inscriptions pour **${raid.name}** (${dateLabel}) sont closes, la composition est prête.\n${raidUrl(raid.id)}`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        // Liste blanche explicite : seul @everyone peut être pingé, rien
        // d'autre n'est interprété dans le message.
        allowed_mentions: { parse: ["everyone"] }
      })
    });
  } catch (err) {
    console.error("Erreur webhook Discord (verrouillage raid) :", err);
  }
}
