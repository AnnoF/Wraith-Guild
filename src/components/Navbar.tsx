"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { SiteRole } from "@prisma/client";

const ROLE_LABELS: Record<SiteRole, string> = {
  RAIDEUR: "Raideur",
  OFFICIER: "Officier",
  ADMINISTRATEUR: "Administrateur"
};

const TABS = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/dashboard/personnages", label: "Mes personnages" },
  { href: "/dashboard/raids-a-venir", label: "Raids à venir" },
  { href: "/dashboard/raids-passes", label: "Raids passés" }
];

export default function Navbar({
  role,
  discordTag
}: {
  role: SiteRole;
  discordTag: string;
}) {
  const pathname = usePathname();
  const { data: session, update: updateSession } = useSession();
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = session?.user.name ?? discordTag;

  function startEditing() {
    setNameInput(displayName);
    setError(null);
    setEditing(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: nameInput })
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erreur lors de la mise à jour.");
      return;
    }
    await updateSession();
    setEditing(false);
  }

  return (
    <header className="border-b-2 border-blood bg-char">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <Link href="/dashboard" className="font-display text-xl text-bone">
          Wraith-Guild
        </Link>

        <nav className="flex gap-1 font-ui text-xs uppercase tracking-wide">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-2 transition-colors focus-ring ${
                pathname === tab.href
                  ? "bg-blood text-void font-semibold"
                  : "text-bone/60 hover:text-bone"
              }`}
            >
              {tab.label}
            </Link>
          ))}
          {(role === "OFFICIER" || role === "ADMINISTRATEUR") && (
            <Link
              href="/officier/raids"
              className={`px-3 py-2 transition-colors focus-ring ${
                pathname.startsWith("/officier")
                  ? "bg-blood text-void font-semibold"
                  : "text-bone/60 hover:text-bone"
              }`}
            >
              Gérer les raids
            </Link>
          )}
          {role === "ADMINISTRATEUR" && (
            <Link
              href="/admin"
              className={`px-3 py-2 transition-colors focus-ring ${
                pathname === "/admin" ? "bg-blood text-void font-semibold" : "text-bone/60 hover:text-bone"
              }`}
            >
              Administration
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <span
            title={ROLE_LABELS[role]}
            className="font-display text-[10px] text-void bg-blood px-3 py-1"
            style={{ clipPath: "polygon(6% 0,100% 0,94% 100%,0 100%)" }}
          >
            {ROLE_LABELS[role]}
          </span>

          {editing ? (
            <form onSubmit={handleSave} className="flex items-center gap-1">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={32}
                autoFocus
                className="bg-void border border-bone/15 focus-ring px-2 py-1 font-ui text-xs text-bone w-28"
              />
              <button
                type="submit"
                disabled={saving}
                title="Enregistrer"
                className="text-moss hover:text-bone focus-ring disabled:opacity-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                title="Annuler"
                className="text-bone/40 hover:text-blood focus-ring"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              {error && <span className="font-ui text-[10px] text-blood">{error}</span>}
            </form>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="font-ui text-sm text-bone/70 hidden sm:inline">{displayName}</span>
              <button
                onClick={startEditing}
                title="Modifier mon nom d'affichage"
                className="text-bone/30 hover:text-bone focus-ring"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            </span>
          )}

          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="font-ui text-sm text-bone/40 hover:text-bone focus-ring"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
