"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CLASS_LABELS, type WowClass } from "@/lib/classes";

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "bg-amber", text: "text-void" },
  ACCEPTEE: { label: "Acceptée", bg: "bg-moss", text: "text-void" },
  REFUSEE: { label: "Refusée", bg: "bg-blood/30", text: "text-bone/70" }
};

interface ApplicationListItem {
  id: string;
  status: string;
  createdAt: string;
  characterName: string;
  wowClass: WowClass;
  spec: string;
  user: { discordTag: string; displayName: string | null };
}

function ApplicationGrid({ applications }: { applications: ApplicationListItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {applications.map((a) => {
        const status = STATUS_STYLE[a.status];
        return (
          <Link
            key={a.id}
            href={`/candidatures/${a.id}`}
            className="war-border bg-char p-4 block hover:bg-char/70 transition-colors focus-ring"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-display text-sm text-bone">{a.characterName}</span>
              <span className={`font-ui text-[10px] uppercase tracking-wide px-2 py-1 ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <p className="font-ui text-xs text-bone/55 mb-1">
              {CLASS_LABELS[a.wowClass]} ({a.spec})
            </p>
            <p className="font-ui text-xs text-bone/55">{a.user.displayName || a.user.discordTag}</p>
          </Link>
        );
      })}
    </div>
  );
}

export default function CandidaturesPage() {
  const [applications, setApplications] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/applications")
      .then((res) => res.json())
      .then((data) => {
        setApplications(data);
        setLoading(false);
      });
  }, []);

  const pending = applications.filter((a) => a.status === "EN_ATTENTE");
  const decided = applications.filter((a) => a.status === "ACCEPTEE" || a.status === "REFUSEE");

  return (
    <div className="space-y-10">
      <p className="font-display text-lg text-bone">Candidatures</p>

      {loading ? (
        <p className="font-ui text-sm text-bone/50">Chargement...</p>
      ) : applications.length === 0 ? (
        <p className="font-ui text-sm text-bone/50">Aucune candidature pour l'instant.</p>
      ) : (
        <>
          <section>
            <p className="font-display text-sm text-bone mb-3">Candidatures en cours</p>
            {pending.length === 0 ? (
              <p className="font-ui text-sm text-bone/50">Aucune candidature en attente.</p>
            ) : (
              <ApplicationGrid applications={pending} />
            )}
          </section>

          <section>
            <p className="font-display text-sm text-bone mb-3">Candidatures acceptées ou refusées</p>
            {decided.length === 0 ? (
              <p className="font-ui text-sm text-bone/50">Aucune candidature traitée pour l'instant.</p>
            ) : (
              <ApplicationGrid applications={decided} />
            )}
          </section>
        </>
      )}
    </div>
  );
}
