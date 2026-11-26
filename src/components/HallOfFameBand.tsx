import { youtubeEmbedUrl } from "@/lib/youtube";
import LightboxImage from "./LightboxImage";
import { GoldRule } from "./Ornaments";

interface Props {
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  eventDate: string | null;
  // true : texte à droite et photo à gauche (un souvenir sur deux)
  reverse?: boolean;
  actions?: React.ReactNode;
}

// Photo par défaut d'un souvenir sans image uploadée, repérée par son titre.
// Une image ajoutée depuis le formulaire reste prioritaire.
function defaultImage(title: string) {
  return title.trim().toLowerCase().startsWith("le rush 60") ? "/vitrine/rush-60.webp" : null;
}

// Un souvenir : texte d'un côté, photo décalée de l'autre, le texte mordant
// sur le bord fondu de la photo. Sur petit écran, la photo passe au-dessus du
// texte pour que celui-ci ne masque pas le sujet de la capture.
export default function HallOfFameBand({ title, description, imageUrl, videoUrl, eventDate, reverse, actions }: Props) {
  const image = imageUrl || defaultImage(title);
  const embedUrl = videoUrl ? youtubeEmbedUrl(videoUrl) : null;

  return (
    <article className="relative flex flex-col justify-center py-6 md:min-h-[340px]">
      {image && (
        // Pas de z-index ni de transform ici : ils enfermeraient l'overlay
        // `fixed` de LightboxImage.
        <div className={`relative h-56 md:absolute md:inset-y-0 md:h-auto md:w-[78%] ${reverse ? "md:left-0" : "md:right-0"}`}>
          <div className="absolute inset-0">
            <LightboxImage
              src={image}
              className={`h-full w-full object-cover object-center hof-photo ${reverse ? "hof-photo-reverse" : ""}`}
            />
          </div>
        </div>
      )}

      <div className={`relative pt-3 md:py-4 md:w-[42%] space-y-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] ${reverse ? "md:self-end" : "md:self-start"}`}>
        <div>
          <h2 className="font-display text-xl gold-gradient-text tracking-widest mb-1">{title}</h2>
          <GoldRule />
          {eventDate && (
            <p className="font-ui text-xs text-amber uppercase tracking-wide mt-1">
              {new Date(eventDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        {description && <p className="font-ui text-sm text-bone whitespace-pre-line">{description}</p>}

        {embedUrl ? (
          <div className="aspect-video">
            <iframe src={embedUrl} title={title} allowFullScreen className="h-full w-full" />
          </div>
        ) : (
          videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-ui text-xs text-bone/70 underline break-all block"
            >
              {videoUrl}
            </a>
          )
        )}

        {actions}
      </div>
    </article>
  );
}
