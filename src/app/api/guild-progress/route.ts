import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canManageRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGuildProgress } from "@/lib/guildProgress";

// GET : progression de guilde affichée sur la page vitrine — publique
// (accueil non connecté compris), donc pas de contrôle de session ici.
export async function GET() {
  const entries = await getGuildProgress();
  return NextResponse.json(entries);
}

// POST : ajoute une instance à la progression (Administrateur uniquement).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canManageRoles(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { instance, killed, total } = await req.json();
  if (!instance || typeof instance !== "string" || !instance.trim()) {
    return NextResponse.json({ error: "Le nom de l'instance est obligatoire" }, { status: 400 });
  }
  if (!Number.isInteger(killed) || !Number.isInteger(total) || killed < 0 || total < 1 || killed > total) {
    return NextResponse.json({ error: "Progression invalide" }, { status: 400 });
  }

  const count = await prisma.guildProgressEntry.count();
  const entry = await prisma.guildProgressEntry.create({
    data: { instance: instance.trim(), killed, total, order: count }
  });
  return NextResponse.json(entry, { status: 201 });
}
