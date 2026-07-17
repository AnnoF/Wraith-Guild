import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH : archiver / réactiver un personnage (pas de suppression dure,
// pour ne pas casser l'historique des raids passés — voir schema.prisma)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const character = await prisma.character.findUnique({ where: { id: params.id } });
  if (!character || character.userId !== session.user.id) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const body = await req.json();
  const updated = await prisma.character.update({
    where: { id: params.id },
    data: { isActive: Boolean(body.isActive) }
  });
  return NextResponse.json(updated);
}
