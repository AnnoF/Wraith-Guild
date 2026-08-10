import { test, expect } from "../fixtures";

// Parcours critique : personne ne doit pouvoir voir une page qui dépasse
// son rôle, que ce soit via le garde-fou de layout (CANDIDAT) ou le contrôle
// serveur des routes API (voir src/lib/auth.ts, canConfigureRaids/canManageRoles).
test.describe("Accès et rôles", () => {
  test("un visiteur non connecté est redirigé vers l'accueil", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL("/");
  });

  test("un compte CANDIDAT est cantonné à /candidature", async ({ page, signInAs }) => {
    await signInAs("CANDIDAT");

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/candidature$/);

    await page.goto("/officier/raids");
    await expect(page).toHaveURL(/\/candidature$/);
  });

  test("un RAIDEUR accède au dashboard mais pas au menu Administration", async ({ page, signInAs }) => {
    const user = await signInAs("RAIDEUR", "E2E Raideur Accès");

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(user.discordTag)).toBeVisible();
    await expect(page.getByRole("link", { name: "Administration" })).toHaveCount(0);
  });

  test("un RAIDEUR se voit refuser l'accès à la page Administration", async ({ page, signInAs }) => {
    await signInAs("RAIDEUR");

    await page.goto("/admin");
    await expect(page.getByText(/réservée aux Administrateurs/i)).toBeVisible();
  });
});
