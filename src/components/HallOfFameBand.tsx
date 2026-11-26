import { youtubeEmbedUrl } from "@/lib/youtube";
import LightboxImage from "./LightboxImage";
import { CornerFlourish, GoldRule } from "./Ornaments";

interface Props {
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  eventDate: string | null;
  actions?: React.ReactNode;
}

// Photo par défaut d'un souvenir sans image uploadée, repérée par son titre.
// Une image ajoutée depuis le formulaire reste prioritaire.
function defaultImage(title: string) {
  return title.trim().toLowerCase().startsWith("le rush 60") ? "/vitrine/rush-60.webp" : null;
}

// Un souvenir présenté en bande plein écran, comme les sections de la page
// d'accueil. La photo est rognée en haut et en bas (format 20/7, centré) et
// le texte passe dessous pour ne pas masquer le sujet de la capture.
//
// Le débordement du conteneur utilise des marges et non `translate` : un
// ancêtre translaté enfermerait l'overlay `fixed` de LightboxImage.
export default function HallOfFameBand({ title, description, imageUrl, videoUrl, eventDate, actions }: Props) {
  const image = imageUrl || defaultImage(title);
  const embedUrl = videoUrl ? youtubeEmbedUrl(videoUrl) : null;

  const heading = (
    <div className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
      <h2 className="font-display text-2xl gold-gradient-text tracking-widest mb-2">{title}</h2>
      <GoldRule />
      {eventDate && (
        <p className="font-ui text-sm text-bone uppercase tracking-wide mt-2">
          {new Date(eventDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
    </div>
  );

  return (
    <article className="relative mx-[calc(50%-50vw)]">
      {image ? (
        <div className="relative w-full aspect-20/7 min-h-[380px]">
          <div className="absolute inset-0">
            <LightboxImage src={image} className="h-full w-full object-cover object-center" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2/5 bg-linear-to-b from-void to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/5 bg-linear-to-t from-void to-transparent" />
          <CornerFlourish className="pointer-events-none absolute top-4 left-4 opacity-50" />
          <CornerFlourish className="pointer-events-none absolute top-4 right-4 opacity-50 scale-x-[-1]" />
          <div className="pointer-events-none absolute inset-x-0 top-0">
            <div className="max-w-6xl mx-auto px-6 md:px-12 pt-8">{heading}</div>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 md:px-12 pt-8">{heading}</div>
      )}

      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-4 pb-12 space-y-4">
        {description && (
          <p className="font-ui text-lg text-bone/85 whitespace-pre-line max-w-3xl">{description}</p>
        )}

        {embedUrl ? (
          <div className="aspect-video max-w-3xl">
            <iframe src={embedUrl} title={title} allowFullScreen className="h-full w-full" />
          </div>
        ) : (
          videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-ui text-sm text-bone/70 underline break-all block"
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
