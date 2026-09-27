import { test, expect, prisma } from "../fixtures";
import { createUser } from "../helpers/db";

test("un RAIDEUR s'inscrit à un raid ouvert", async ({ page, signInAs }) => {
  // Le raid est semé directement en base : ce parcours teste l'inscription
  // d'un joueur, pas la création du raid par un Officier (couverte dans
  // raid-composition.spec.ts).
  const officer = await createUser("OFFICIER");
  const raidDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const raid = await prisma.raid.create({
    data: {
      name: "Soirée Hyjal",
      date: raidDate,
      endTime: new Date(raidDate.getTime() + 3 * 60 * 60 * 1000),
      status: "OUVERT",
      createdById: officer.id,
      phases: {
        create: [{ order: 0, runs: { create: [{ title: "Hyjal Summit", size: 20, order: 0 }] } }]
      }
    }
  });

  await signInAs("RAIDEUR");
  await page.goto(`/raids/${raid.id}`);

  await page.getByPlaceholder("Ex. dispo après 21h").fill("Dispo dès 20h");
  await page.getByRole("button", { name: "S'inscrire" }).click();

  await expect(page.getByText("Vous êtes inscrit")).toBeVisible();
  await expect(page.getByText("Phase 1 : en attente d'assignation")).toBeVisible();
});
