import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions, canConfigureRaids, canManageRoles } from "@/lib/auth";
import { getRecruitmentStatus } from "@/lib/recruitment";
import { getGuildProgress } from "@/lib/guildProgress";
import { GALLERY_IMAGES } from "@/lib/gallery";
import { TWITCH_CLIPS } from "@/lib/twitchClips";
import { prisma } from "@/lib/prisma";
import { raidTitleLabel } from "@/lib/raidInstances";
import Footer from "./Footer";
import TwitchClips from "./TwitchClips";
import TwitchStreamEmbed from "./TwitchStreamEmbed";
import LightboxImage from "./LightboxImage";
import GuildProgressEditor from "./GuildProgressEditor";
import RecruitmentEditor from "./RecruitmentEditor";
import { CornerFlourish, GoldRule } from "./Ornaments";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-sm gold-gradient-text tracking-[0.1em] mb-2">{children}</h2>
      <GoldRule />
    </div>
  );
}

// Bande plein écran (fond illustré + dégradé vers le noir) utilisée pour
// regrouper visuellement plusieurs sections, comme dans la maquette de la
// vitrine. Casse le conteneur `max-w-5xl` du parent (même technique que
// HeroBanner : relative left-1/2 w-screen -translate-x-1/2).
function FullBleedBand({ image, children }: { image: string; children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(8,20,23,0.375) 0%, var(--void) 90%)" }}
      />
      <CornerFlourish className="absolute top-4 left-4 z-10 opacity-50" />
      <CornerFlourish className="absolute top-4 right-4 z-10 opacity-50 scale-x-[-1]" />
      <div className="relative max-w-6xl mx-auto px-6 md:px-12">{children}</div>
    </div>
  );
}

async function getUpcomingRaids() {
  return prisma.raid.findMany({
    where: { date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 3,
    select: { id: true, titles: true, date: true }
  });
}

export default async function GuildShowcase() {
  const session = await getServerSession(authOptions);
  const isAdmin = canManageRoles(session?.user.siteRole);
  const canEditRecruitment = canConfigureRaids(session?.user.siteRole);
  const [raids, progress, recruitmentStatus] = await Promise.all([
    getUpcomingRaids(),
    getGuildProgress(),
    getRecruitmentStatus()
  ]);
  const previewClips = TWITCH_CLIPS.slice(0, 2);
  const previewScreenshots = GALLERY_IMAGES.slice(0, 2);

  return (
    <div>
      <FullBleedBand image="/vitrine/recrutement-bg.jpg">
        <section id="recrutement" className="scroll-mt-20 pt-16 pb-16">
          <SectionTitle>État du recrutement</SectionTitle>
          <p className="font-ui text-sm text-bone/65 mb-6 max-w-3xl">
            Nous restons ouverts à toutes les candidatures de qualité. Le
            tableau ci-dessous reflète simplement nos besoins actuels par
            rôle : certaines spécialisations sont activement recherchées,
            tandis que d&apos;autres ne seront retenues que si le profil se
            démarque réellement.
          </p>
          <RecruitmentEditor initialStatus={recruitmentStatus} canEdit={canEditRecruitment} />
        </section>

        <section id="candidature" className="scroll-mt-20 pb-16 max-w-3xl">
          <SectionTitle>Candidature</SectionTitle>
          <p className="font-ui text-sm text-bone/85 mb-4">
            Intéressé·e pour rejoindre Wraith ? Découvrez nos objectifs, le
            profil recherché et déposez votre candidature.
          </p>
          <Link
            href="/candidature"
            className="inline-block font-display text-xs bg-gold text-void font-medium rounded-full px-6 py-3 hover:bg-amber transition-colors focus-ring"
          >
            Déposer une candidature →
          </Link>
        </section>
      </FullBleedBand>

      <FullBleedBand image="/vitrine/raids-bg.jpg">
        <div className="grid md:grid-cols-2 gap-10 pt-16 pb-16">
          <div id="raids" className="scroll-mt-20">
            <SectionTitle>Raids à venir</SectionTitle>
            {raids.length === 0 ? (
              <p className="font-ui text-sm text-bone/50">Aucun raid à venir pour le moment.</p>
            ) : (
              <div className="flex flex-col gap-px bg-bone/10">
                {raids.map((r) => {
                  const date = new Date(r.date);
                  const dateLabel = date.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    timeZone: "Europe/Paris"
                  });
                  const timeLabel = date.toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Paris"
                  });
                  return (
                    <div key={r.id} className="bg-char flex items-center justify-between gap-4 px-5 py-4">
                      <p className="font-display text-sm text-bone">{raidTitleLabel(r.titles)}</p>
                      <p className="font-ui text-xs text-bone/55 shrink-0">{dateLabel}, {timeLabel}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div id="progression" className="scroll-mt-20">
            <SectionTitle>Notre progression</SectionTitle>
            <GuildProgressEditor initialEntries={progress} isAdmin={isAdmin} />
          </div>
        </div>
      </FullBleedBand>

      <FullBleedBand image="/vitrine/streams-bg.jpg">
        <section id="streams" className="scroll-mt-20 pt-16 pb-16">
          <SectionTitle>Streams Twitch</SectionTitle>
          <TwitchStreamEmbed />
        </section>

        <section id="mediatheque" className="scroll-mt-20 pb-20">
          <div className="flex items-baseline justify-between mb-5">
            <SectionTitle>Médiathèque</SectionTitle>
            <Link href="/galerie" className="font-display text-xs text-bone/50 hover:text-bone focus-ring">
              Voir toute la médiathèque →
            </Link>
          </div>
          {previewClips.length === 0 && previewScreenshots.length === 0 ? (
            <p className="font-ui text-sm text-bone/50">Screenshots et vidéos à venir.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <TwitchClips clips={previewClips} />
              {previewScreenshots.map((src) => (
                <LightboxImage key={src} src={src} className="w-full aspect-[16/10] object-cover" />
              ))}
            </div>
          )}
        </section>
      </FullBleedBand>

      <Footer />
    </div>
  );
}
