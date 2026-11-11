import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canManageRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH : bannir / débannir un compte (Administrateur uniquement).
// Un banni ne peut plus se connecter (voir callback signIn de
// src/lib/auth.ts) et ses sessions en cours perdent tout droit. Le
// bannissement repasse aussi le compte en CANDIDAT (journalisé dans
// RoleAudit) et le verrouille pour la resynchro Discord ; débannir ne
// rend aucun droit, c'est à l'Administrateur d'attribuer un rôle ensuite.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canManageRoles(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { banned } = await req.json().catch(() => ({}));
  if (typeof banned !== "boolean") {
    return NextResponse.json({ error: "Valeur invalide" }, { status: 400 });
  }
  if (banned && id === session.user.id) {
    return NextResponse.json({ error: "Tu ne peux pas te bannir toi-même" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  if (!banned) {
    const updated = await prisma.user.update({ where: { id }, data: { isBanned: false } });
    return NextResponse.json(updated);
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: { isBanned: true, siteRole: "CANDIDAT", rolesLocked: true }
    }),
    ...(target.siteRole !== "CANDIDAT"
      ? [
          prisma.roleAudit.create({
            data: {
              targetUserId: id,
              grantedById: session.user.id,
              previousRole: target.siteRole,
              newRole: "CANDIDAT"
            }
          })
        ]
      : [])
  ]);
  return NextResponse.json(updated);
}
