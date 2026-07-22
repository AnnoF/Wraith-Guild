import Link from "next/link";
import { GALLERY_IMAGES } from "@/lib/gallery";
import { TWITCH_CLIPS } from "@/lib/twitchClips";
import TwitchClips from "@/components/TwitchClips";

export default function GaleriePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <Link href="/" className="font-ui text-xs text-bone/50 hover:text-bone">
        ← Retour à l'accueil
      </Link>

      <h1 className="font-display text-3xl text-blood uppercase tracking-wide mt-4 mb-10">
        Galerie / Médiathèque
      </h1>

      <section className="mb-12">
        <h2 className="font-display text-lg text-bone mb-4">Clips Twitch</h2>
        {TWITCH_CLIPS.length === 0 ? (
          <p className="font-ui text-sm text-bone/50">Aucun clip pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TwitchClips clips={TWITCH_CLIPS} />
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg text-bone mb-4">Screenshots</h2>
        {GALLERY_IMAGES.length === 0 ? (
          <p className="font-ui text-sm text-bone/50">Aucun screenshot pour le moment.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {GALLERY_IMAGES.map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" className="w-full h-40 object-cover" />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
