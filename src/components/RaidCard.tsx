import Link from "next/link";

export interface RaidData {
  id: string;
  title: string;
  date: string;
  size: number;
  instance: string | null;
  status: "OUVERT" | "FERME" | "TERMINE" | "ANNULE";
  _count?: { signups: number };
}

const STATUS_STYLE: Record<RaidData["status"], { label: string; bg: string; text: string }> = {
  OUVERT: { label: "Ouvert", bg: "bg-moss", text: "text-void" },
  FERME: { label: "Presque complet", bg: "bg-amber", text: "text-void" },
  TERMINE: { label: "Terminé", bg: "bg-bone/15", text: "text-bone/70" },
  ANNULE: { label: "Annulé", bg: "bg-blood/30", text: "text-bone/70" }
};

export default function RaidCard({ raid, href }: { raid: RaidData; href?: string }) {
  const status = STATUS_STYLE[raid.status];
  const date = new Date(raid.date);
  const dateLabel = date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "long"
  });
  const timeLabel = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link href={href ?? `/raids/${raid.id}`} className="war-border bg-char p-4 block hover:bg-char/70 transition-colors focus-ring">
      <div className="flex justify-between items-start mb-2">
        <span className="font-display text-sm text-bone">{raid.title}</span>
        <span className={`font-ui text-[10px] uppercase tracking-wide px-2 py-1 ${status.bg} ${status.text}`}>
          {status.label}
        </span>
      </div>
      <p className="font-ui text-xs text-bone/55 mb-1">{dateLabel}, {timeLabel}</p>
      <p className="font-ui text-xs text-bone/55">
        {raid._count?.signups ?? 0} / {raid.size} inscrits
        {raid.instance ? ` · ${raid.instance}` : ""}
      </p>
    </Link>
  );
}
