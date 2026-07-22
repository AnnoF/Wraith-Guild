import Link from "next/link";
import { CLASS_SPECS } from "@/lib/classes";
import { RECRUITMENT_COLUMNS } from "@/lib/recruitment";
import { GUILD_PROGRESS, DISCORD_INVITE_URL } from "@/lib/guildInfo";
import { GALLERY_IMAGES } from "@/lib/gallery";
import { TWITCH_CLIPS } from "@/lib/twitchClips";
import { prisma } from "@/lib/prisma";
import ClassSpecIcon from "./ClassSpecIcon";
import Footer from "./Footer";
import TwitchClips from "./TwitchClips";
import TwitchStreamEmbed from "./TwitchStreamEmbed";

const QUI_SOMMES_NOUS = `En 2019, un noyau de joueurs qui se connaissent pour la plupart depuis 2004 sur WoW Vanilla, principalement issus de guildes de Ner'Zhul-EU (dont plusieurs membres ont été chez <wraith>), s'est réuni avec l'idée de se relancer une fois de plus dans l'aventure de Classic WoW. Un premier recrutement sur invitation, ciblant nos connaissances, nos recommandations et des joueurs fiables, a ensuite laissé place à un recrutement plus large, à la recherche de profils alliant maturité et performance. Ce recrutement est resté ouvert jusqu'en 2024, où nous avons décidé de nous arrêter à la sortie de Cataclysm Classic.

Tout cela nous amène à aujourd'hui. Un nouveau noyau de joueurs, formé d'anciens membres de Wraith et de joueurs de Wraith Classic, souhaite se lancer dans une nouvelle aventure : World of Warcraft Camelote.`;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-2xl md:text-3xl text-blood uppercase tracking-wide mb-4">
      {children}
    </h2>
  );
}

async function getUpcomingRaids() {
  return prisma.raid.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 3,
    select: { id: true, title: true, date: true }
  });
}

export default async function GuildShowcase() {
  const raids = await getUpcomingRaids();
  const previewClips = TWITCH_CLIPS.slice(0, 2);
  const previewScreenshots = GALLERY_IMAGES.slice(0, 2);

  return (
    <div>
      <div className="space-y-16">
        <section id="qui-sommes-nous" className="scroll-mt-20 max-w-3xl mx-auto text-center">
          <SectionTitle>Qui sommes-nous ?</SectionTitle>
          <p className="font-ui text-bone leading-relaxed whitespace-pre-line">
            {QUI_SOMMES_NOUS}
          </p>
        </section>

        <section id="recrutement" className="scroll-mt-20">
          <SectionTitle>État du recrutement</SectionTitle>
          <p className="font-ui text-sm text-bone/60 mb-6 max-w-3xl">
            Nous restons ouverts à toutes les candidatures de qualité. Le
            tableau ci-dessous reflète simplement nos besoins actuels par
            rôle : certaines spécialisations sont activement recherchées,
            tandis que d'autres ne seront retenues que si le profil se
            démarque réellement.
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

        <section className="grid md:grid-cols-2 gap-8">
          <div id="raids" className="scroll-mt-20">
            <SectionTitle>Raids à venir</SectionTitle>
            {raids.length === 0 ? (
              <p className="font-ui text-sm text-bone/50">Aucun raid à venir pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {raids.map((r) => {
                  const date = new Date(r.date);
                  const dateLabel = date.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "long"
                  });
                  const timeLabel = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={r.id} className="war-border bg-char p-4">
                      <p className="font-display text-sm text-bone">{r.title}</p>
                      <p className="font-ui text-xs text-bone/55 mt-1">{dateLabel}, {timeLabel}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div id="progression" className="scroll-mt-20">
            <SectionTitle>Notre progression</SectionTitle>
            <div className="space-y-3">
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
          </div>
        </section>

        <section id="candidature" className="scroll-mt-20">
          <SectionTitle>Candidature</SectionTitle>
          <p className="font-ui text-sm text-bone/50">
            Le formulaire de candidature est en préparation — revenez bientôt.
          </p>
        </section>

        <section id="mediatheque" className="scroll-mt-20">
          <SectionTitle>Galerie / Médiathèque</SectionTitle>
          {previewClips.length === 0 && previewScreenshots.length === 0 ? (
            <p className="font-ui text-sm text-bone/50">Screenshots et vidéos à venir.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <TwitchClips clips={previewClips} />
                {previewScreenshots.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="w-full aspect-video object-cover" />
                ))}
              </div>
              <Link
                href="/galerie"
                className="inline-block font-ui text-xs text-bone/50 hover:text-bone mt-4 focus-ring"
              >
                Voir toute la médiathèque →
              </Link>
            </>
          )}
        </section>

        <section>
          <SectionTitle>Streams Twitch</SectionTitle>
          <TwitchStreamEmbed />
        </section>

        <section className="war-border bg-char p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-display text-lg text-bone">Rejoignez la communauté</p>
            <p className="font-ui text-sm text-bone/60 mt-1">
              Même sans rejoindre nos raids tout de suite, venez discuter avec
              nous et faire connaissance avec la guilde.
            </p>
          </div>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-sm shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] transition-colors text-white font-medium focus-ring"
          >
            Rejoindre le Discord
          </a>
        </section>
      </div>

      <Footer />
    </div>
  );
}
