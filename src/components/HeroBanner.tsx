"use client";
import { useRef, useState } from "react";
import { QUI_SOMMES_NOUS } from "@/lib/aboutInfo";
import { CornerFlourish, GoldRule } from "./Ornaments";

// Bannière plein écran en tête de la vitrine, avec la section "Qui sommes-nous ?"
// qui prolonge le même fond vidéo (dégradé continu jusqu'au noir). Casse le
// conteneur `max-w-5xl` du parent avec la technique full-bleed déjà utilisée
// dans la page de composition (relative left-1/2 w-screen -translate-x-1/2).
export default function HeroBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  function toggleSound() {
    const next = !muted;
    setMuted(next);
    if (videoRef.current) videoRef.current.muted = next;
  }

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-55"
      >
        <source src="/video/hero.mp4" type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggleSound}
        className="absolute top-4 right-4 z-20 font-display text-xs text-bone/80 bg-void/60 hover:bg-void/80 transition-colors px-3 py-1.5 rounded-full focus-ring"
      >
        {muted ? "🔇 Son" : "🔊 Son"}
      </button>
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgba(4,14,17,0.275) 0%, rgba(8,20,23,0.425) 55%, var(--void) 100%)"
        }}
      />

      <div className="relative z-10 min-h-[340px] flex items-end px-6 md:px-12 pb-11">
        <div className="flex items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_net.png" alt="" className="h-16 w-16 md:h-20 md:w-20 shrink-0" style={{ clipPath: "circle(47%)" }} />
          <h1 className="font-display text-4xl md:text-6xl gold-gradient-text">WRAITH</h1>
        </div>
      </div>

      <section id="qui-sommes-nous" className="scroll-mt-20 relative z-10 px-6 md:px-12 pb-16">
        <CornerFlourish className="absolute -top-2 left-4 opacity-60" />
        <h2 className="font-display text-sm gold-gradient-text tracking-[0.1em] mb-2">Qui sommes-nous ?</h2>
        <GoldRule className="mb-4" />
        <p className="max-w-3xl font-ui text-bone/85 leading-relaxed whitespace-pre-line">
          {QUI_SOMMES_NOUS}
        </p>
      </section>
    </section>
  );
}
