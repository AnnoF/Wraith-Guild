import { CLASS_SPECS } from "@/lib/classes";
import { RECRUITMENT_COLUMNS } from "@/lib/recruitment";
import { GUILD_PROGRESS, DISCORD_INVITE_URL } from "@/lib/guildInfo";
import ClassSpecIcon from "./ClassSpecIcon";
import HeroImageFade from "./HeroImageFade";

const QUI_SOMMES_NOUS = `En 2019, un noyau de joueurs qui se connaissent pour la plupart depuis 2004 sur WoW Vanilla, principalement issus de guildes de Ner'Zhul-EU (dont plusieurs membres ont été chez <wraith>), s'est réuni avec l'idée de se relancer une fois de plus dans l'aventure de Classic WoW. Un premier recrutement sur invitation, ciblant nos connaissances, nos recommandations et des joueurs fiables, a ensuite laissé place à un recrutement plus large, à la recherche de profils alliant maturité et performance. Ce recrutement est resté ouvert jusqu'en 2024, où nous avons décidé de nous arrêter à la sortie de Cataclysm Classic.

Tout cela nous amène à aujourd'hui. Un nouveau noyau de joueurs, formé d'anciens membres de Wraith et de joueurs de Wraith Classic, souhaite se lancer dans une nouvelle aventure : World of Warcraft Camelote.`;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl md:text-3xl text-blood uppercase tracking-wide mb-4">
      {children}
    </h2>
  );
}

export default function GuildShowcase() {
  return (
    <div className="space-y-16">
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <SectionTitle>Qui sommes-nous ?</SectionTitle>
          <p className="font-ui text-bone leading-relaxed whitespace-pre-line">
            {QUI_SOMMES_NOUS}
          </p>
        </div>
        <HeroImageFade />
      </section>

      <section>
        <SectionTitle>État du recrutement</SectionTitle>
        <p className="font-ui text-sm text-bone/60 mb-6 max-w-3xl">
          Nous restons ouverts à toute candidature de qualité. Le tableau
          ci-dessous reflète simplement notre besoin actuel par rôle :
          certaines spécialisations sont recherchées en priorité, d'autres
          ne retiendront que des profils vraiment exceptionnels.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {RECRUITMENT_COLUMNS.map((col) => (
            <div key={col.label} className="war-border bg-char">
              <div className={`font-display text-sm text-void px-3 py-1.5 ${col.colorClass}`}>
                {col.label}
              </div>
              <div className="p-3 flex flex-wrap gap-2">
                {col.classes.flatMap((wowClass) =>
                  CLASS_SPECS[wowClass].map((spec) => (
                    <ClassSpecIcon key={`${wowClass}-${spec}`} wowClass={wowClass} spec={spec} size="h-7 w-7" />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Candidature</SectionTitle>
        <p className="font-ui text-sm text-bone/50">
          Le formulaire de candidature est en préparation — revenez bientôt.
        </p>
      </section>

      <section>
        <SectionTitle>Progression de la guilde</SectionTitle>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GUILD_PROGRESS.map((entry) => (
            <div key={entry.instance} className="war-border bg-char p-4">
              <p className="font-display text-sm text-bone mb-2">{entry.instance}</p>
              <div className="h-2 w-full bg-void mb-2">
                <div
                  className="h-2 bg-blood"
                  style={{ width: `${(entry.killed / entry.total) * 100}%` }}
                />
              </div>
              <p className="font-ui text-xs text-bone/60">
                {entry.killed} / {entry.total}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Galerie / Médiathèque</SectionTitle>
        <p className="font-ui text-sm text-bone/50">
          Screenshots et vidéos à venir.
        </p>
      </section>

      <section>
        <SectionTitle>Stream Twitch Live</SectionTitle>
        <p className="font-ui text-sm text-bone/50">
          Les chaînes de nos streameurs seront intégrées ici prochainement.
        </p>
      </section>

      <section>
        <SectionTitle>Rejoindre le Discord</SectionTitle>
        <p className="font-ui text-sm text-bone/70 mb-4">
          Vous n'êtes pas encore membre de la guilde et souhaitez échanger
          avec nous ? Rejoignez notre Discord.
        </p>
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-ui text-sm text-void bg-blood px-5 py-2.5 hover:bg-blood/80 focus-ring"
        >
          Rejoindre le Discord →
        </a>
      </section>
    </div>
  );
}
