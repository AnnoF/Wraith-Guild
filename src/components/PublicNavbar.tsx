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
  return (
    <header className="border-b-2 border-blood bg-char">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_net.png" alt="" className="h-9 w-9 shrink-0" style={{ clipPath: "circle(47%)" }} />
          <span className="font-display text-xl text-bone">Wraith</span>
        </Link>

        <nav className="flex gap-1 font-ui text-xs uppercase tracking-wide">
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

        {isCandidateLoggedIn ? (
          <div className="flex items-center gap-3">
            <Link href="/candidature" className="font-ui text-xs text-bone/70 hover:text-bone focus-ring">
              Ma candidature
            </Link>
            <SignOutLink className="font-ui text-xs text-bone/40 hover:text-bone focus-ring" />
          </div>
        ) : (
          <SignInButton />
        )}
      </div>
    </header>
  );
}
