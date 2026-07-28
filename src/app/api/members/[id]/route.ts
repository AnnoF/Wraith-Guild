import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH : archive ou réactive un membre (départ de guilde), Officier+.
// Archiver une personne archive aussi tous ses personnages actifs (comme
// pour un personnage seul, jamais de suppression dure — l'historique des
// raids passés reste intact). Réactiver la personne ne réactive pas ses
// personnages automatiquement : à faire au cas par cas depuis "Mes
// personnages" une fois revenue.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { isArchived } = await req.json();
  if (typeof isArchived !== "boolean") {
    return NextResponse.json({ error: "Champ invalide" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const [user] = await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { isArchived } }),
    ...(isArchived
      ? [prisma.character.updateMany({ where: { userId: id, isActive: true }, data: { isActive: false } })]
      : [])
  ]);

  return NextResponse.json(user);
}
