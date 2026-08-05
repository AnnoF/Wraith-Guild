import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";

// Fichiers uploadés dynamiquement (Hall of Fame...), servis directement par
// Next.js depuis public/. Volontairement hors de git (.gitignore) : ce n'est
// pas un asset versionné mais du contenu ajouté en prod par les Officiers.
const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function saveUploadedImage(file: File, subdir: string): Promise<string> {
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    throw new Error("Format d'image non supporté (jpg, png, webp ou gif uniquement).");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image trop volumineuse (8 Mo maximum).");
  }

  const dir = path.join(UPLOADS_ROOT, subdir);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return `/uploads/${subdir}/${filename}`;
}

// Best-effort : une image orpheline (échec de suppression) n'est pas
// bloquante pour l'opération appelante.
export async function deleteUploadedImage(url: string | null | undefined) {
  if (!url || !url.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", url));
  } catch {
    // fichier déjà absent, ou permissions — on ignore
  }
}
