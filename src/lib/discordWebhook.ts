// Alertes Discord sur les candidatures, via un webhook de canal (voir
// DISCORD_APPLICATIONS_WEBHOOK_URL dans .env — à créer sur le serveur
// Discord : Paramètres du salon > Intégrations > Webhooks > Nouveau
// webhook). N'échoue jamais bruyamment : une panne du webhook ne doit
// pas empêcher une candidature ou un message d'être enregistré.

// Vue officiers (nécessite le rôle Raideur+, jamais accessible à un
// candidat).
function applicationUrl(id: string) {
  const base = process.env.NEXTAUTH_URL || "";
  return `${base}/candidatures/${id}`;
}

// Vue candidat (sa propre candidature, /candidature ne prend pas d'id).
export function candidateApplicationUrl() {
  const base = process.env.NEXTAUTH_URL || "";
  return `${base}/candidature`;
}

async function postToWebhook(embed: Record<string, unknown>) {
  const url = process.env.DISCORD_APPLICATIONS_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch (err) {
    console.error("Erreur webhook Discord (candidatures) :", err);
  }
}

export async function notifyNewApplication(application: {
  id: string;
  characterName: string;
  discordTag: string;
  classLabel: string;
  spec: string;
}) {
  await postToWebhook({
    title: "📋 Nouvelle candidature",
    description: `**${application.characterName}** (${application.classLabel} — ${application.spec})\nContact Discord : ${application.discordTag}`,
    url: applicationUrl(application.id),
    color: 0xa61b1b,
    timestamp: new Date().toISOString()
  });
}

export async function notifyNewExchangeMessage(params: {
  applicationId: string;
  characterName: string;
  authorLabel: string;
  body: string;
}) {
  const truncated = params.body.length > 200 ? `${params.body.slice(0, 200)}…` : params.body;
  await postToWebhook({
    title: "💬 Nouveau message sur une candidature",
    description: `**${params.authorLabel}** a répondu sur la candidature de **${params.characterName}**\n> ${truncated}`,
    url: applicationUrl(params.applicationId),
    color: 0x7a9b5c,
    timestamp: new Date().toISOString()
  });
}
