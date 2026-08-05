"use client";
import { useState } from "react";
import Link from "next/link";
import SignOutLink from "./SignOutLink";
import SignInButton from "./SignInButton";

const ANCHORS = [
  { href: "#qui-sommes-nous", label: "À propos" },
  { href: "#raids", label: "Raids" },
  { href: "#progression", label: "Progression" },
  { href: "#mediatheque", label: "Médiathèque" },
  { href: "#recrutement", label: "Recrutement" },
  { href: "/candidature", label: "Candidature" }
];

export default function PublicNavbar({ isCandidateLoggedIn = false }: { isCandidateLoggedIn?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b-2 border-blood bg-char">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_net.png" alt="" className="h-9 w-9 shrink-0" style={{ clipPath: "circle(47%)" }} />
            <span className="font-display text-xl text-bone">Wraith</span>
          </Link>

          <nav className="hidden md:flex gap-1 font-ui text-xs uppercase tracking-wide">
            {ANCHORS.map((a) => (
              <a
                key={a.href}
                href={a.href}
                className="px-3 py-2 text-bone/60 hover:text-bone transition-colors focus-ring"
              >
                {a.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
              className="md:hidden text-bone/70 hover:text-bone focus-ring p-1 -mr-1"
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

            {isCandidateLoggedIn ? (
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/candidature" className="font-ui text-xs text-bone/70 hover:text-bone focus-ring">
                  Ma candidature
                </Link>
                <SignOutLink className="font-ui text-xs text-bone/40 hover:text-bone focus-ring" />
              </div>
            ) : (
              <div className="hidden sm:block">
                <SignInButton />
              </div>
            )}
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden mt-3 pt-3 border-t border-bone/10 flex flex-col gap-1 font-ui text-xs uppercase tracking-wide">
            {ANCHORS.map((a) => (
              <a
                key={a.href}
                href={a.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2 text-bone/60 hover:text-bone transition-colors focus-ring"
              >
                {a.label}
              </a>
            ))}
            <div className="pt-2 mt-1 border-t border-bone/10">
              {isCandidateLoggedIn ? (
                <div className="flex items-center gap-4 px-3 py-2">
                  <Link href="/candidature" className="font-ui text-xs text-bone/70 hover:text-bone focus-ring" onClick={() => setMobileOpen(false)}>
                    Ma candidature
                  </Link>
                  <SignOutLink className="font-ui text-xs text-bone/40 hover:text-bone focus-ring" />
                </div>
              ) : (
                <div className="px-3 py-1">
                  <SignInButton />
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
