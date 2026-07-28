import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSafeHttpUrl } from "@/lib/url";

// PATCH : édite une entrée de guide (Officier/Administrateur uniquement).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.bossName !== undefined) {
    if (typeof body.bossName !== "string" || !body.bossName.trim()) {
      return NextResponse.json({ error: "Nom de boss invalide" }, { status: 400 });
    }
    data.bossName = body.bossName.trim();
  }
  if (body.videoUrl !== undefined) {
    if (body.videoUrl && !isSafeHttpUrl(body.videoUrl)) {
      return NextResponse.json({ error: "Lien vidéo invalide" }, { status: 400 });
    }
    data.videoUrl = body.videoUrl || null;
  }
  if (body.notes !== undefined) {
    data.notes = body.notes || null;
  }
  if (body.order !== undefined) {
    data.order = Number(body.order);
  }

  const entry = await prisma.guideEntry.update({ where: { id }, data });
  return NextResponse.json(entry);
}

// DELETE : retire une entrée de guide (Officier/Administrateur uniquement).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  await prisma.guideEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
