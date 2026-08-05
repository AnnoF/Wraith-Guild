import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSafeHttpUrl } from "@/lib/url";
import { deleteUploadedImage } from "@/lib/uploads";

// PATCH : édite un souvenir (Officier/Administrateur uniquement).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const existing = await prisma.hallOfFameEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      return NextResponse.json({ error: "Titre invalide" }, { status: 400 });
    }
    data.title = body.title.trim();
  }
  if (body.description !== undefined) {
    data.description = body.description || null;
  }
  if (body.videoUrl !== undefined) {
    if (body.videoUrl && !isSafeHttpUrl(body.videoUrl)) {
      return NextResponse.json({ error: "Lien vidéo invalide" }, { status: 400 });
    }
    data.videoUrl = body.videoUrl || null;
  }
  if (body.eventDate !== undefined) {
    data.eventDate = body.eventDate ? new Date(body.eventDate) : null;
  }
  if (body.imageUrl !== undefined) {
    if (body.imageUrl && typeof body.imageUrl !== "string") {
      return NextResponse.json({ error: "Image invalide" }, { status: 400 });
    }
    if (existing.imageUrl && existing.imageUrl !== body.imageUrl) {
      await deleteUploadedImage(existing.imageUrl);
    }
    data.imageUrl = body.imageUrl || null;
  }

  const entry = await prisma.hallOfFameEntry.update({ where: { id }, data });
  return NextResponse.json(entry);
}

// DELETE : retire un souvenir (Officier/Administrateur uniquement).
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const existing = await prisma.hallOfFameEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.hallOfFameEntry.delete({ where: { id } });
  await deleteUploadedImage(existing.imageUrl);
  return NextResponse.json({ ok: true });
}
