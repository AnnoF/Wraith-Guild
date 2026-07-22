import { DISCORD_INVITE_URL } from "@/lib/guildInfo";

// Bannière plein écran en tête de la vitrine. Casse le conteneur
// `max-w-5xl` du parent avec la technique full-bleed déjà utilisée dans
// la page de composition (relative left-1/2 w-screen -translate-x-1/2).
export default function HeroBanner() {
  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 h-[70vh] min-h-[480px] overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/qui-sommes-nous.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(13,11,10,0.55) 0%, rgba(13,11,10,0.75) 60%, rgba(13,11,10,1) 100%)"
        }}
      />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
        <div className="flex items-center gap-4">
          {/* rounded-full recadre l'image en cercle : ne garde que le rond noir du logo, sans le carré blanc autour */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_net.png" alt="" className="h-16 w-16 rounded-full" />
          <h1 className="font-display text-5xl md:text-7xl text-bone">WRAITH</h1>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-sm inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] transition-colors text-white font-medium focus-ring"
          >
            Rejoindre le Discord
          </a>
          <a
            href="#candidature"
            className="font-display text-sm inline-flex items-center gap-2 px-6 py-3 border border-bone/30 hover:border-bone text-bone transition-colors focus-ring"
          >
            Déposer une candidature
          </a>
        </div>
      </div>

      <a
        href="#qui-sommes-nous"
        aria-label="Défiler vers le contenu"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-bone/50 hover:text-bone focus-ring"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </section>
  );
}
