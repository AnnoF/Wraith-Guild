// Clips Twitch mis en avant sur la vitrine (public/api Twitch non utilisée,
// simple intégration d'iframes clips.twitch.tv). Domaine(s) de production
// utilisés pour le paramètre `parent` requis par Twitch.
export const TWITCH_EMBED_PARENTS = ["wraith-guild.fr", "www.wraith-guild.fr"];

export interface TwitchClip {
  streamer: string;
  slug: string;
}

export const TWITCH_CLIPS: TwitchClip[] = [
  { streamer: "Mazunoir", slug: "ResoluteTangentialBottleDeIlluminati" },
  { streamer: "Lycharz", slug: "EvilDaintyAlfalfaSoonerLater-OieebGHN93ZMPtm3" },
  { streamer: "Mazunoir", slug: "BillowingPerfectCrabArsonNoSexy" },
  { streamer: "Lycharz", slug: "ConsiderateCleanJackalChocolateRain-OLKmCrw6JCQ2QNLN" },
  { streamer: "Lycharz", slug: "ArtsyFaintOpossumCclamChamp-6gI3K3HSwZUBFOKX" },
  { streamer: "Lycharz", slug: "InterestingSlickHamburgerDendiFace-ghsgbwCjgLDsb3rj" },
  { streamer: "Lycharz", slug: "BillowingFurtiveTitanNotATK-Zl_PQ9efNJCufZFb" }
];
