"use client";
import { useEffect, useState } from "react";

interface UserRow {
  id: string;
  discordTag: string;
  siteRole: "CANDIDAT" | "SOCIAL" | "APPLY" | "MEMBER" | "OFFICIER" | "ADMINISTRATEUR";
  isBanned: boolean;
}

type GrantableRole = Exclude<UserRow["siteRole"], "CANDIDAT">;

const ROLE_LABELS: Record<GrantableRole, string> = {
  SOCIAL: "Social",
  APPLY: "Apply",
  MEMBER: "Member",
  OFFICIER: "Officier",
  ADMINISTRATEUR: "Administrateur"
};

const ROLES: GrantableRole[] = ["SOCIAL", "APPLY", "MEMBER", "OFFICIER", "ADMINISTRATEUR"];

// Page réservée aux Administrateurs : attribution des rôles du site,
// retrait des droits et bannissement.
// Le contrôle d'accès réel se fait côté API (canManageRoles) — cette page
// suppose que l'utilisateur a déjà les droits (sinon les appels échoueront).
export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      setUsers(await res.json());
    } else {
      setError("Accès refusé — cette page est réservée aux Administrateurs.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function send(url: string, body: unknown) {
    setActionError(null);
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Action impossible.");
    }
    load();
  }

  function changeRole(userId: string, role: UserRow["siteRole"]) {
    return send(`/api/admin/users/${userId}/role`, { role });
  }

  function revokeRights(u: UserRow) {
    if (!confirm(`Retirer les droits de ${u.discordTag} ? Le compte repasse en Candidat.`)) return;
    return changeRole(u.id, "CANDIDAT");
  }

  function setBanned(u: UserRow, banned: boolean) {
    const message = banned
      ? `Bannir ${u.discordTag} ? Le compte ne pourra plus se connecter au site.`
      : `Débannir ${u.discordTag} ? Il restera Candidat, sans droits.`;
    if (!confirm(message)) return;
    return send(`/api/admin/users/${u.id}/ban`, { banned });
  }

  if (loading && users.length === 0) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;
  if (error) return <p className="font-ui text-sm text-garnet">{error}</p>;

  return (
    <div className="space-y-6">
      <p className="font-display text-lg text-bone">Administration — Rôles</p>

      {actionError && <p className="font-ui text-sm text-garnet">{actionError}</p>}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="gilt-frame rounded-xs bg-char px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <span className="font-ui text-sm text-bone flex items-center gap-2">
              {u.discordTag}
              {u.isBanned && (
                <span className="font-ui text-xs px-2 py-0.5 rounded-full bg-garnet text-bone">Banni</span>
              )}
              {!u.isBanned && u.siteRole === "CANDIDAT" && (
                <span className="font-ui text-xs px-2 py-0.5 rounded-full border border-bone/20 text-bone/60">
                  Candidat
                </span>
              )}
            </span>
            <div className="flex gap-1 flex-wrap">
              {!u.isBanned &&
                ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => changeRole(u.id, r)}
                    className={`font-ui text-xs px-3 py-1.5 rounded-full focus-ring ${
                      u.siteRole === r ? "bg-gold text-void font-medium" : "border border-bone/20 text-bone/60 hover:text-bone"
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              {!u.isBanned && u.siteRole !== "CANDIDAT" && (
                <button
                  onClick={() => revokeRights(u)}
                  className="font-ui text-xs px-3 py-1.5 rounded-full focus-ring border border-garnet text-garnet hover:bg-garnet hover:text-bone"
                >
                  Retirer les droits
                </button>
              )}
              <button
                onClick={() => setBanned(u, !u.isBanned)}
                className={`font-ui text-xs px-3 py-1.5 rounded-full focus-ring ${
                  u.isBanned
                    ? "border border-bone/20 text-bone/60 hover:text-bone"
                    : "bg-garnet text-bone hover:opacity-90"
                }`}
              >
                {u.isBanned ? "Débannir" : "Bannir"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
