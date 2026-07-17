import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WOW_CLASSES, CLASS_SPECS } from "@/lib/classes";

// GET : liste des personnages de l'utilisateur connecté
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const characters = await prisma.character.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json(characters);
}

// POST : création d'un personnage
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const body = await req.json();
  const { name, wowClass, spec } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Nom de personnage invalide" }, { status: 400 });
  }
  if (!WOW_CLASSES.includes(wowClass)) {
    return NextResponse.json({ error: "Classe invalide" }, { status: 400 });
  }
  if (!CLASS_SPECS[wowClass as keyof typeof CLASS_SPECS].includes(spec)) {
    return NextResponse.json({ error: "Spécialisation invalide pour cette classe" }, { status: 400 });
  }

  try {
    const character = await prisma.character.create({
      data: { name: name.trim(), class: wowClass, spec, userId: session.user.id }
    });
    return NextResponse.json(character, { status: 201 });
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
