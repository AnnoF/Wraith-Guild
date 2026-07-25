"use client";
import { useState } from "react";

// Vignette cliquable : ouvre l'image en plein format dans une overlay,
// sans dépendance externe ni état partagé entre vignettes.
export default function LightboxImage({ src, className }: { src: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block w-full h-full focus-ring">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className={className} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-void/90 flex items-center justify-center p-6"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="absolute top-4 right-4 text-bone/70 hover:text-bone focus-ring"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
