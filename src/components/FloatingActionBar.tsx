"use client";
import { useState } from "react";
import Link from "next/link";
import { DISCORD_INVITE_URL } from "@/lib/guildInfo";

type BarState = "expanded" | "collapsed" | "closed";

const BAR_HEIGHT: Record<BarState, number> = { expanded: 70, collapsed: 44, closed: 0 };

// Barre d'actions persistante en bas de la vitrine (rejoindre le Discord /
// candidater), réductible ou masquable. Le spacer ci-dessous réserve la
// place correspondante dans le flux de la page pour ne pas recouvrir le
// footer.
export default function FloatingActionBar() {
  const [state, setState] = useState<BarState>("expanded");

  return (
    <>
      <div style={{ height: BAR_HEIGHT[state] }} className="transition-[height] duration-200" />
      <div
        className="fixed inset-x-0 bottom-0 z-30 bg-void/95 backdrop-blur border-t border-blood/30"
        style={{ display: state === "closed" ? "none" : "block" }}
      >
        {state === "collapsed" && (
          <button
            type="button"
            onClick={() => setState("expanded")}
            className="w-full flex items-center justify-center gap-3 px-6 py-2.5 focus-ring"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_net.png" alt="" className="h-5 w-5" style={{ clipPath: "circle(47%)" }} />
            <span className="font-ui text-sm text-bone font-medium">Wraith — Rejoindre / Candidater</span>
            <span className="text-bone/50 text-base absolute right-6">▲</span>
          </button>
        )}

        {state === "expanded" && (
          <div className="relative flex items-center px-6 py-3.5 min-h-[70px]">
            <div className="flex items-center gap-2.5 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo_net.png" alt="Wraith" className="h-7 w-7 shrink-0" style={{ clipPath: "circle(47%)" }} />
              <span className="font-display text-lg text-bone whitespace-nowrap">WRAITH</span>
            </div>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 flex-wrap justify-center px-16">
              <a
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-xs bg-blood hover:bg-amber transition-colors text-bone px-5 py-2.5 focus-ring"
              >
                Rejoindre le Discord
              </a>
              <Link
                href="/candidature"
                className="font-display text-xs border border-bone/25 hover:border-amber text-bone px-5 py-2.5 transition-colors focus-ring"
              >
                Candidater
              </Link>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setState("collapsed")}
                title="Réduire"
                className="text-bone/50 hover:text-bone px-1 focus-ring"
              >
                ▼
              </button>
              <button
                type="button"
                onClick={() => setState("closed")}
                title="Fermer"
                className="text-bone/50 hover:text-bone px-1 text-lg focus-ring"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
