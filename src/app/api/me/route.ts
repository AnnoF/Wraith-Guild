import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH : définit (ou efface) le nom d'affichage personnalisé de l'utilisateur
// connecté. Vide -> revient au pseudo Discord (discordTag).
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

  const { displayName } = await req.json();
  const trimmed = typeof displayName === "string" ? displayName.trim() : "";
  if (trimmed.length > 32) {
    return NextResponse.json({ error: "32 caractères maximum" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: trimmed || null }
  });
  return NextResponse.json({ displayName: updated.displayName, discordTag: updated.discordTag });
}
