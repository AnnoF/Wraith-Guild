import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CLASS_SPECS, type WowClass } from "@/lib/classes";
import { PROFESSIONS, MAX_PROFESSIONS_PER_CHARACTER } from "@/lib/professions";
import { MAIN_ALT_STATUSES, isMainAltStatusLocked, canSetMainAltStatus, type MainAltStatus } from "@/lib/mainAlt";

// PATCH : archiver/réactiver un personnage, et/ou éditer son nom, sa
// spécialisation et ses métiers (pas de suppression dure, pour ne pas
// casser l'historique des raids passés — voir schema.prisma). La classe
// reste fixe.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!isMember(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const character = await prisma.character.findUnique({ where: { id } });
  if (!character || character.userId !== session.user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2) {
      return NextResponse.json({ error: "Nom de personnage invalide" }, { status: 400 });
    }
    data.name = name;
  }

  if (body.secondaryName !== undefined) {
    const secondaryName = typeof body.secondaryName === "string" ? body.secondaryName.trim() : "";
    data.secondaryName = secondaryName || null;
  }

  if (body.canRaidLead !== undefined) {
    data.canRaidLead = Boolean(body.canRaidLead);
  }

  if (body.mainAltStatus !== undefined) {
    if (isMainAltStatusLocked(character.mainAltStatus as MainAltStatus)) {
      return NextResponse.json(
        { error: "Le statut Main/Main Alt de ce personnage ne peut plus être modifié" },
        { status: 400 }
      );
    }
    if (!MAIN_ALT_STATUSES.includes(body.mainAltStatus)) {
      return NextResponse.json(
        { error: "Merci de choisir un statut Main, Main Alt ou Alt" },
        { status: 400 }
      );
    }
    if (body.mainAltStatus !== "ALT") {
      const siblings = await prisma.character.findMany({
        where: { userId: session.user.id, id: { not: id } },
        select: { mainAltStatus: true }
      });
      const siblingStatuses = siblings.map((s) => s.mainAltStatus);
      if (!canSetMainAltStatus(body.mainAltStatus as MainAltStatus, siblingStatuses)) {
        return NextResponse.json(
          {
            error:
              body.mainAltStatus === "MAIN"
                ? "Vous avez déjà un personnage Main"
                : "Vous avez déjà un personnage Main Alt"
          },
          { status: 409 }
        );
      }
    }
    data.mainAltStatus = body.mainAltStatus;
  }

  if (body.spec !== undefined) {
    if (!CLASS_SPECS[character.class as WowClass].includes(body.spec)) {
      return NextResponse.json({ error: "Spécialisation invalide pour cette classe" }, { status: 400 });
    }
    data.spec = body.spec;
  }

  if (body.professions !== undefined) {
    const professionsInput = Array.isArray(body.professions) ? body.professions : [];
    if (professionsInput.length > MAX_PROFESSIONS_PER_CHARACTER) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PROFESSIONS_PER_CHARACTER} métiers par personnage` },
        { status: 400 }
      );
    }
    const professionNames = new Set<string>();
    for (const p of professionsInput) {
      if (!PROFESSIONS.includes(p?.profession)) {
        return NextResponse.json({ error: "Métier invalide" }, { status: 400 });
      }
      professionNames.add(p.profession);
    }
    if (professionNames.size !== professionsInput.length) {
      return NextResponse.json({ error: "Métier en double" }, { status: 400 });
    }
    data.professions = {
      deleteMany: {},
      create: professionsInput.map((p: { profession: string; isMaxed?: boolean }) => ({
        profession: p.profession as (typeof PROFESSIONS)[number],
        isMaxed: Boolean(p.isMaxed)
      }))
    };
  }

  try {
    const updated = await prisma.character.update({
      where: { id },
      data,
      include: { professions: true }
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Vous avez déjà un personnage avec ce nom" },
        { status: 409 }
      );
    }
    throw err;
  }
}
