import { test, expect, prisma } from "../fixtures";
import { createUser } from "../helpers/db";

test("un RAIDEUR s'inscrit à un raid ouvert", async ({ page, signInAs }) => {
  // Le raid est semé directement en base : ce parcours teste l'inscription
  // d'un joueur, pas la création du raid par un Officier (couverte dans
  // raid-composition.spec.ts).
  const officer = await createUser("OFFICIER");
  const raid = await prisma.raid.create({
    data: {
      titles: ["Hyjal Summit"],
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      size: 20,
      status: "OUVERT",
      createdById: officer.id
    }
  });

  await signInAs("RAIDEUR");
  await page.goto(`/raids/${raid.id}`);

  await page.getByPlaceholder("Ex. dispo après 21h").fill("Dispo dès 20h");
  await page.getByRole("button", { name: "S'inscrire" }).click();

  await expect(page.getByText("Vous êtes inscrit")).toBeVisible();
  await expect(page.getByText("En attente d'assignation d'un personnage par un Officier.")).toBeVisible();
});
