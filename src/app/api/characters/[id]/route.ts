import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CLASS_SPECS, type WowClass } from "@/lib/classes";
import { PROFESSIONS, MAX_PROFESSIONS_PER_CHARACTER } from "@/lib/professions";

// PATCH : archiver/réactiver un personnage, et/ou éditer son nom, sa
// spécialisation et ses métiers (pas de suppression dure, pour ne pas
// casser l'historique des raids passés — voir schema.prisma). La classe
// reste fixe.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const character = await prisma.character.findUnique({ where: { id: params.id } });
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

  if (body.canRaidLead !== undefined) {
    data.canRaidLead = Boolean(body.canRaidLead);
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
      where: { id: params.id },
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
