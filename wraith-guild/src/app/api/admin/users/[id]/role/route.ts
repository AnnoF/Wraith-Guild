import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, canManageRoles } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["RAIDEUR", "OFFICIER", "ADMINISTRATEUR"];

// PATCH : changer le rôle site d'un utilisateur (Administrateur uniquement)
// Chaque changement est journalisé dans RoleAudit pour la traçabilité.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  if (!canManageRoles(session.user.siteRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { role } = await req.json();
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  const [updated] = await prisma.$transaction([
    prisma.user.update({ where: { id: params.id }, data: { siteRole: role } }),
    prisma.roleAudit.create({
      data: {
        targetUserId: params.id,
        grantedById: session.user.id,
        previousRole: target.siteRole,
        newRole: role
      }
    })
  ]);

  return NextResponse.json(updated);
}
