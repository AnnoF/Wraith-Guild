import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids } from "@/lib/auth";
import { saveUploadedImage } from "@/lib/uploads";

// POST : upload d'un screenshot pour le Hall of Fame (Officier/Administrateur uniquement).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canConfigureRaids(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }

  try {
    const url = await saveUploadedImage(file, "hall-of-fame");
    return NextResponse.json({ url }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'upload";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
