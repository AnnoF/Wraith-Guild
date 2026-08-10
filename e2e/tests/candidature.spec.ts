import { test, expect, prisma } from "../fixtures";

// Le dépôt initial d'une candidature (formulaire public) est conditionné
// côté serveur à une vérification d'appartenance Discord réelle
// (fetchGuildMember, voir src/app/api/applications/me/route.ts) qu'on ne
// peut pas simuler ici sans un vrai bot Discord + serveur de guilde — hors
// de portée d'un test E2E local. Ce parcours part donc d'une candidature
// déjà déposée (semée en base) et couvre la partie métier critique : suivi
// du statut, échange candidat/officiers, décision de l'Officier.
test("le candidat échange avec les officiers, qui traitent la candidature", async ({ page, signInAs }) => {
  const candidat = await signInAs("CANDIDAT", "E2E Candidat");
  const application = await prisma.application.create({
    data: {
      userId: candidat.id,
      discordTag: candidat.discordTag,
      characterName: "Fillebete",
      wowClass: "CHAMAN",
      spec: "Restoration",
      race: "Tauren",
      level: "60",
      professions: ["ALCHEMY"],
      addons: "Details, WeakAuras",
      uiScreenshotUrl: "https://example.com/ui.png",
      experience: "Raid lead sur un serveur précédent.",
      goals: "Progresser sur le contenu de raid chaque semaine.",
      pvpGoals: "Aucun objectif PvP particulier.",
      nightsPerWeek: 3,
      availableNights: ["Mardi", "Jeudi", "Dimanche"],
      discoverySource: "Bouche à oreille.",
      knownMembers: "Aucune."
    }
  });

  await page.goto("/candidature");
  await expect(page.getByText("En attente")).toBeVisible();
  await expect(page.getByText("Fillebete")).toBeVisible();

  await page.getByPlaceholder("Votre message...").fill("Hâte d'avoir des nouvelles !");
  await page.getByRole("button", { name: "Envoyer" }).click();
  await expect(page.getByText("Hâte d'avoir des nouvelles !")).toBeVisible();

  await signInAs("OFFICIER");
  await page.goto("/candidatures");
  await page.getByRole("link", { name: /Fillebete/ }).click();

  await expect(page).toHaveURL(new RegExp(`/candidatures/${application.id}$`));
  await expect(page.getByText("Hâte d'avoir des nouvelles !")).toBeVisible();

  await page.getByRole("button", { name: "Accepter" }).click();
  await expect(page.getByText("Acceptée")).toBeVisible();
});
