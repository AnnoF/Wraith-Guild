import { test, expect } from "../fixtures";

test("un RAIDEUR crée un personnage et le voit apparaître dans sa liste", async ({ page, signInAs }) => {
  await signInAs("RAIDEUR");
  await page.goto("/dashboard/personnages");

  await page.getByRole("button", { name: "+ Nouveau personnage" }).click();

  // Les labels "Classe"/"Spécialisation" ne sont pas associés à leur <select>
  // via for/id ou wrapping (voir CharacterForm.tsx) : getByLabel ne les
  // trouverait pas, on cible donc par ordre d'apparition dans le formulaire.
  await page.getByPlaceholder("Ex. Polecat").fill("Thragosh");
  await page.getByRole("combobox").nth(0).selectOption("PRETRE");
  await page.getByRole("combobox").nth(1).selectOption("Holy");
  await page.getByLabel("Herbalism").check();

  await page.getByRole("button", { name: "Créer le personnage" }).click();

  const card = page.locator(".war-border", { hasText: "Thragosh" });
  await expect(card).toBeVisible();
  await expect(card).toContainText("Priest");
  await expect(card).toContainText("Holy");
});
