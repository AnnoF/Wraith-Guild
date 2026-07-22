import { TWITCH_LIVE_CHANNELS } from "@/lib/twitchChannels";
import { TWITCH_EMBED_PARENTS } from "@/lib/twitchClips";

const PARENT_QUERY = TWITCH_EMBED_PARENTS.map((p) => `parent=${p}`).join("&");

export default function TwitchStreamEmbed() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {TWITCH_LIVE_CHANNELS.map((channel) => (
        <div key={channel} className="war-border bg-char p-2">
          <div className="aspect-video">
            <iframe
              src={`https://player.twitch.tv/?channel=${channel}&${PARENT_QUERY}`}
              allowFullScreen
              className="h-full w-full"
            />
          </div>
          <p className="font-ui text-xs text-bone/50 mt-2 px-1">{channel}</p>
        </div>
      ))}
    </div>
  );
}
