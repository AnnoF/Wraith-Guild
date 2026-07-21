"use client";
import { useState } from "react";

// Image du bloc "Qui sommes-nous ?" : bord gauche fondu (mask-image) pour
// se fondre dans le texte à côté plutôt qu'une coupe nette. Tant que
// /images/qui-sommes-nous.jpg n'existe pas, affiche un fond de secours au
// lieu d'une image cassée.
const FADE_STYLE = {
  WebkitMaskImage: "linear-gradient(to right, transparent, black 18%)",
  maskImage: "linear-gradient(to right, transparent, black 18%)"
};

export default function HeroImageFade() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="h-64 md:h-80 w-full bg-char"
        style={FADE_STYLE}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/qui-sommes-nous.jpg"
      alt=""
      onError={() => setFailed(true)}
      className="h-64 md:h-80 w-full object-cover"
      style={FADE_STYLE}
    />
  );
}
