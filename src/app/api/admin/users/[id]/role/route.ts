import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canManageRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["CANDIDAT", "SOCIAL", "APPLY", "MEMBER", "OFFICIER", "ADMINISTRATEUR"];

// PATCH : changer le rôle site d'un utilisateur (Administrateur uniquement)
// Chaque changement est journalisé dans RoleAudit pour la traçabilité.
// Passer en CANDIDAT retire les droits : le compte est alors verrouillé
// (rolesLocked) pour que la resynchro Discord quotidienne ne les rende pas ;
// attribuer un autre rôle le déverrouille.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canManageRoles(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { role } = await req.json();
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  if (id === session.user.id && role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Tu ne peux pas retirer tes propres droits" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  if (target.isBanned) {
    return NextResponse.json({ error: "Utilisateur banni : débannis-le d'abord" }, { status: 409 });
  }

  const [updated] = await prisma.$transaction([
    prisma.user.update({ where: { id }, data: { siteRole: role, rolesLocked: role === "CANDIDAT" } }),
    prisma.roleAudit.create({
      data: {
        targetUserId: id,
        grantedById: session.user.id,
        previousRole: target.siteRole,
        newRole: role
      }
    })
  ]);

  return NextResponse.json(updated);
}
