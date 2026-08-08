import Link from "next/link";
import { raidTitleLabel } from "@/lib/raidInstances";

export interface RaidData {
  id: string;
  titles: string[];
  date: string;
  size: number;
  status: "OUVERT" | "FERME" | "TERMINE" | "ANNULE";
  signupDeadline?: string | null;
  _count?: { signups: number };
}

const STATUS_STYLE: Record<RaidData["status"], { label: string; bg: string; text: string }> = {
  OUVERT: { label: "Ouvert", bg: "bg-moss", text: "text-void" },
  FERME: { label: "Inscription terminée", bg: "bg-amber", text: "text-void" },
  TERMINE: { label: "Terminé", bg: "bg-bone/15", text: "text-bone/70" },
  ANNULE: { label: "Annulé", bg: "bg-blood/30", text: "text-bone/70" }
};

// Compte à rebours affiché tant que le raid est ouvert aux inscriptions :
// jusqu'à signupDeadline si précisée, sinon jusqu'à la date du raid
// elle-même (les inscriptions restent ouvertes jusqu'au début du raid).
function timeUntilSignupsClose(target: Date): string {
  const diffMinutes = Math.floor((target.getTime() - Date.now()) / 60000);
  if (diffMinutes <= 0) return "Fin des inscriptions imminente";

  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  if (days >= 1) return `Encore ${days} jour${days > 1 ? "s" : ""} avant la fin des inscriptions`;
  if (hours >= 1) return `Encore ${hours} heure${hours > 1 ? "s" : ""} avant la fin des inscriptions`;
  return `Encore ${minutes} minute${minutes > 1 ? "s" : ""} avant la fin des inscriptions`;
}

export default function RaidCard({ raid, href }: { raid: RaidData; href?: string }) {
  const status = STATUS_STYLE[raid.status];
  const date = new Date(raid.date);
  const dateLabel = date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long"
  });
  const timeLabel = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const signupsCloseLabel =
    raid.status === "OUVERT"
      ? timeUntilSignupsClose(raid.signupDeadline ? new Date(raid.signupDeadline) : date)
      : null;

  return (
    <Link href={href ?? `/raids/${raid.id}`} className="war-border bg-char p-4 block hover:bg-char/70 transition-colors focus-ring">
      <div className="flex justify-between items-start mb-2">
        <span className="font-display text-sm text-bone">{raidTitleLabel(raid.titles)}</span>
        <span className={`font-ui text-[10px] uppercase tracking-wide px-2 py-1 ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>
      <p className="font-ui text-xs text-bone/55 mb-1">{dateLabel}, {timeLabel}</p>
      <p className="font-ui text-xs text-bone/55">
        {raid._count?.signups ?? 0} / {raid.size} inscrits
      </p>
      {signupsCloseLabel && (
        <p className="font-ui text-[11px] text-amber mt-1">{signupsCloseLabel}</p>
      )}
    </Link>
  );
}
