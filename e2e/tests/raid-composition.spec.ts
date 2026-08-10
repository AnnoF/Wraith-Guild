import { test, expect, prisma } from "../fixtures";
import { createUser } from "../helpers/db";

test("un OFFICIER crée un raid puis y place un inscrit", async ({ page, signInAs }) => {
  await signInAs("OFFICIER");

  await page.goto("/officier/raids/nouveau");
  await page.getByRole("button", { name: /Zul'Gurub/ }).click();
  await page.locator('input[type="datetime-local"]').first().fill("2026-09-01T20:00");
  await page.getByRole("button", { name: "Créer le raid" }).click();

  await page.waitForURL(/\/officier\/raids\/[^/]+\/composition$/);
  const raidId = new URL(page.url()).pathname.split("/")[3];

  // Un joueur inscrit sans personnage assigné : c'est ce que le
  // constructeur de composition est censé permettre de placer (voir
  // src/app/(app)/officier/raids/[id]/composition/page.tsx).
  const raider = await createUser("RAIDEUR", "E2E Raideur Compo");
  const character = await prisma.character.create({
    data: { name: "Grognemitaine", class: "GUERRIER", spec: "Protection", userId: raider.id }
  });
  await prisma.raidSignup.create({
    data: { raidId, userId: raider.id, status: "INSCRIT" }
  });

  await page.reload();

  await expect(page.getByText("Placés : 0 / 20")).toBeVisible();
  await page.getByText(character.name).dblclick();

  await expect(page.getByText("Placés : 1 / 20")).toBeVisible();
  await expect(page.getByText("Tous les inscrits sont placés.")).toBeVisible();
});
