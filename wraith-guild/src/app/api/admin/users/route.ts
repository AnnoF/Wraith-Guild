import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canManageRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET : liste de tous les utilisateurs du site (Administrateur uniquement)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canManageRoles(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { discordTag: "asc" },
    select: { id: true, discordTag: true, avatarUrl: true, siteRole: true, createdAt: true }
  });
  return NextResponse.json(users);
}
