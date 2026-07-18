"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { SiteRole } from "@prisma/client";

const ROLE_LABELS: Record<SiteRole, string> = {
  RAIDEUR: "Raideur",
  OFFICIER: "Officier",
  ADMINISTRATEUR: "Administrateur"
};

const TABS = [
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

  return (
    <header className="border-b-2 border-blood bg-char">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <Link href="/dashboard/personnages" className="font-display text-xl text-bone">
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
          <span className="font-ui text-sm text-bone/70 hidden sm:inline">{discordTag}</span>
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
