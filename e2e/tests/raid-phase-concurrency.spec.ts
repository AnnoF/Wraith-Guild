import { test, expect, prisma } from "../fixtures";
import { createUser } from "../helpers/db";

// Une phase à deux instances concurrentes (ex: deux Hyjal Summit en même
// temps) : un même joueur ne doit jamais pouvoir être placé dans les deux,
// puisqu'elles se déroulent simultanément (voir PATCH
// /api/raids/[id]/signup, garde "samePhaseConflict").
test("un joueur ne peut pas être placé dans deux instances concurrentes de la même phase", async ({
  page,
  signInAs
}) => {
  const officer = await signInAs("OFFICIER");

  const raidDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const raid = await prisma.raid.create({
    data: {
      name: "Soirée double Hyjal",
      date: raidDate,
      endTime: new Date(raidDate.getTime() + 3 * 60 * 60 * 1000),
      status: "OUVERT",
      createdById: officer.id,
      phases: {
        create: [
          {
            order: 0,
            runs: {
              create: [
                { title: "Hyjal Summit", size: 20, order: 0 },
                { title: "Hyjal Summit", size: 20, order: 1 }
              ]
            }
          }
        ]
      }
    },
    include: { phases: { include: { runs: true } } }
  });
  const [runA, runB] = raid.phases[0].runs;

  const raider = await createUser("RAIDEUR", "E2E Raideur Concurrence");
  const character = await prisma.character.create({
    data: { name: "Doublemploi", class: "CHASSEUR", spec: "Précision", userId: raider.id }
  });
  await prisma.raidSignup.create({
    data: { raidId: raid.id, userId: raider.id, status: "INSCRIT" }
  });

  const placeInA = await page.request.patch(`/api/raids/${raid.id}/signup`, {
    data: { userId: raider.id, runId: runA.id, slot: 0, characterId: character.id }
  });
  expect(placeInA.ok()).toBe(true);

  const placeInB = await page.request.patch(`/api/raids/${raid.id}/signup`, {
    data: { userId: raider.id, runId: runB.id, slot: 0, characterId: character.id }
  });
  expect(placeInB.status()).toBe(409);
  const body = await placeInB.json();
  expect(body.error).toContain("même temps");

  const placements = await prisma.raidPlacement.findMany({ where: { characterId: character.id } });
  expect(placements).toHaveLength(1);
  expect(placements[0].runId).toBe(runA.id);
});
