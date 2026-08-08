import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canManageRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH : édite une instance de la progression (Administrateur uniquement).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canManageRoles(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const existing = await prisma.guildProgressEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.instance !== undefined) {
    if (typeof body.instance !== "string" || !body.instance.trim()) {
      return NextResponse.json({ error: "Nom d'instance invalide" }, { status: 400 });
    }
    data.instance = body.instance.trim();
  }

  if (body.killed !== undefined || body.total !== undefined) {
    const killed = body.killed !== undefined ? body.killed : existing.killed;
    const total = body.total !== undefined ? body.total : existing.total;
    if (!Number.isInteger(killed) || !Number.isInteger(total) || killed < 0 || total < 1 || killed > total) {
      return NextResponse.json({ error: "Progression invalide" }, { status: 400 });
    }
    data.killed = killed;
    data.total = total;
  }

  const entry = await prisma.guildProgressEntry.update({ where: { id }, data });
  return NextResponse.json(entry);
}

// DELETE : retire une instance de la progression (Administrateur uniquement).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canManageRoles(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const existing = await prisma.guildProgressEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.guildProgressEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
