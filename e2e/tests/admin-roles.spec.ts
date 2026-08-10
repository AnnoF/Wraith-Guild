import { test, expect } from "../fixtures";
import { createUser } from "../helpers/db";

test("un ADMINISTRATEUR change le rôle d'un membre", async ({ page, signInAs }) => {
  const member = await createUser("RAIDEUR", "E2E À Promouvoir");
  await signInAs("ADMINISTRATEUR");

  await page.goto("/admin");

  const row = page.locator("div", { hasText: member.discordTag }).last();
  await row.getByRole("button", { name: "Officier" }).click();

  // La ligne se reconstruit après le PATCH (re-fetch de la liste) : le
  // bouton "Officier" doit passer en état sélectionné (fond plein).
  await expect(row.getByRole("button", { name: "Officier" })).toHaveClass(/bg-blood/);
});
