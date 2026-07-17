"use client";
import { useEffect, useState } from "react";

interface UserRow {
  id: string;
  discordTag: string;
  siteRole: "RAIDEUR" | "OFFICIER" | "ADMINISTRATEUR";
}

const ROLES: UserRow["siteRole"][] = ["RAIDEUR", "OFFICIER", "ADMINISTRATEUR"];

// Page réservée aux Administrateurs : attribution des rôles du site.
// Le contrôle d'accès réel se fait côté API (canManageRoles) — cette page
// suppose que l'utilisateur a déjà les droits (sinon les appels échoueront).
export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  async function changeRole(userId: string, role: UserRow["siteRole"]) {
    await fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });
    load();
  }

  if (loading) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;
  if (error) return <p className="font-ui text-sm text-blood">{error}</p>;

  return (
    <div className="space-y-6">
      <p className="font-display text-lg text-bone">Administration — Rôles</p>

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="war-border bg-char px-4 py-3 flex items-center justify-between flex-wrap gap-2">
            <span className="font-ui text-sm text-bone">{u.discordTag}</span>
            <div className="flex gap-1">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => changeRole(u.id, r)}
                  className={`font-ui text-xs px-3 py-1.5 focus-ring ${
                    u.siteRole === r ? "bg-blood text-void font-medium" : "border border-bone/20 text-bone/60 hover:text-bone"
                  }`}
                >
                  {r === "RAIDEUR" ? "Raideur" : r === "OFFICIER" ? "Officier" : "Administrateur"}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
