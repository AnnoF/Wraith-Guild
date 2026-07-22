import { DISCORD_INVITE_URL } from "@/lib/guildInfo";

const FOOTER_LINKS = [
  { href: "#qui-sommes-nous", label: "À propos" },
  { href: "#raids", label: "Raids" },
  { href: "#progression", label: "Progression" },
  { href: "#mediatheque", label: "Médiathèque" },
  { href: "#recrutement", label: "Recrutement" }
];

export default function Footer() {
  return (
    <footer className="border-t-2 border-blood mt-16">
      <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_net.png" alt="" className="h-8 w-8 rounded-full" />
          <span className="font-display text-lg text-bone">Wraith</span>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-ui text-xs uppercase tracking-wide text-bone/50">
          {FOOTER_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-bone transition-colors focus-ring">
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-ui text-xs text-[#5865F2] hover:text-[#7a85f5] transition-colors focus-ring"
        >
          Discord
        </a>

        <p className="font-ui text-xs text-bone/30">
          © {new Date().getFullYear()} Wraith-Guild — Tous droits réservés
        </p>
      </div>
    </footer>
  );
}
