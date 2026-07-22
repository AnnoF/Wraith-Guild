import { TWITCH_CLIPS, TWITCH_EMBED_PARENTS } from "@/lib/twitchClips";

const PARENT_QUERY = TWITCH_EMBED_PARENTS.map((p) => `parent=${p}`).join("&");

export default function TwitchClips() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {TWITCH_CLIPS.map((clip) => (
        <div key={clip.slug} className="war-border bg-char p-2">
          <div className="aspect-video">
            <iframe
              src={`https://clips.twitch.tv/embed?clip=${clip.slug}&${PARENT_QUERY}`}
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <p className="font-ui text-xs text-bone/50 mt-2 px-1">{clip.streamer}</p>
        </div>
      ))}
    </div>
  );
}
