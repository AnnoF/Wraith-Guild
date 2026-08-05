import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids, isMember } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSafeHttpUrl } from "@/lib/url";

// GET : liste des souvenirs du Hall of Fame (tout membre connecté, pas les CANDIDAT).
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!isMember(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const entries = await prisma.hallOfFameEntry.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }]
  });
  return NextResponse.json(entries);
}

// POST : ajoute un souvenir (Officier/Administrateur uniquement).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { title, description, imageUrl, videoUrl, eventDate } = await req.json();
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 });
  }
  if (videoUrl && !isSafeHttpUrl(videoUrl)) {
    return NextResponse.json({ error: "Lien vidéo invalide" }, { status: 400 });
  }
  if (imageUrl && typeof imageUrl !== "string") {
    return NextResponse.json({ error: "Image invalide" }, { status: 400 });
  }

  const entry = await prisma.hallOfFameEntry.create({
    data: {
      title: title.trim(),
      description: description || null,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      eventDate: eventDate ? new Date(eventDate) : null
    }
  });
  return NextResponse.json(entry, { status: 201 });
}
