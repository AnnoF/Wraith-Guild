"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import type { SiteRole } from "@prisma/client";

const ROLE_LABELS: Record<SiteRole, string> = {
  CANDIDAT: "Candidat",
  RAIDEUR: "Raideur",
  OFFICIER: "Officier",
  ADMINISTRATEUR: "Administrateur"
};

const TABS = [
  { href: "/dashboard", label: "Accueil" },
  { href: "/dashboard/personnages", label: "Mes personnages" },
  { href: "/dashboard/raids-a-venir", label: "Raids à venir" },
  { href: "/dashboard/raids-passes", label: "Raids passés" },
  { href: "/candidatures", label: "Candidatures" },
  { href: "/guide", label: "Guides" },
  { href: "/hall-of-fame", label: "Hall of Fame" }
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = session?.user.name ?? discordTag;

  const extraLinks = [
    (role === "OFFICIER" || role === "ADMINISTRATEUR") && { href: "/officier/raids", label: "Gérer les raids", match: (p: string) => p.startsWith("/officier") },
    (role === "OFFICIER" || role === "ADMINISTRATEUR") && { href: "/membres", label: "Membres", match: (p: string) => p === "/membres" },
    (role === "OFFICIER" || role === "ADMINISTRATEUR") && { href: "/presence", label: "Présence", match: (p: string) => p === "/presence" },
    role === "ADMINISTRATEUR" && { href: "/admin", label: "Administration", match: (p: string) => p === "/admin" }
  ].filter(Boolean) as { href: string; label: string; match: (p: string) => boolean }[];

  const allLinks = [
    ...TABS.map((tab) => ({ href: tab.href, label: tab.label, match: (p: string) => p === tab.href })),
    ...extraLinks
  ];

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
      <div className="max-w-5xl mx-auto px-6 py-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_net.png" alt="" className="h-9 w-9 shrink-0" style={{ clipPath: "circle(47%)" }} />
          <span className="font-display text-xl text-bone">Wraith</span>
        </Link>

        <nav className="hidden lg:flex gap-1 font-ui text-xs uppercase tracking-wide flex-wrap">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 transition-colors focus-ring ${
                link.match(pathname)
                  ? "bg-blood text-void font-semibold"
                  : "text-bone/60 hover:text-bone"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileOpen}
            className="lg:hidden text-bone/70 hover:text-bone focus-ring p-1 -mr-1"
          >
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            )}
          </button>

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

      {mobileOpen && (
        <nav className="lg:hidden mt-3 pt-3 border-t border-bone/10 flex flex-col gap-1 font-ui text-xs uppercase tracking-wide">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2 transition-colors focus-ring ${
                link.match(pathname)
                  ? "bg-blood text-void font-semibold"
                  : "text-bone/60 hover:text-bone"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}

      <div className="flex justify-end mt-1">
        <span
          title={ROLE_LABELS[role]}
          className="font-display text-[10px] text-void bg-blood px-3 py-1"
          style={{ clipPath: "polygon(6% 0,100% 0,94% 100%,0 100%)" }}
        >
          {ROLE_LABELS[role]}
        </span>
      </div>
      </div>
    </header>
  );
}
