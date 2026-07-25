"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import ClassSpecIcon from "@/components/ClassSpecIcon";
import { CLASS_LABELS, type WowClass } from "@/lib/classes";
import { PROFESSION_LABELS, type Profession } from "@/lib/professions";

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "bg-amber", text: "text-void" },
  ACCEPTEE: { label: "Acceptée", bg: "bg-moss", text: "text-void" },
  REFUSEE: { label: "Refusée", bg: "bg-blood/30", text: "text-bone/70" }
};

interface Comment {
  id: string;
  visibility: "INTERNE" | "PARTAGE";
  body: string;
  createdAt: string;
  author: { discordTag: string; displayName: string | null };
}

interface ApplicationDetail {
  id: string;
  status: string;
  createdAt: string;
  discordTag: string;
  characterName: string;
  wowClass: WowClass;
  spec: string;
  race: string;
  level: string;
  professions: Profession[];
  addons: string;
  uiScreenshotUrl: string;
  experience: string;
  goals: string;
  pvpGoals: string;
  nightsPerWeek: number;
  availableNights: string[];
  discoverySource: string;
  knownMembers: string;
  extra: string | null;
  user: { discordTag: string; displayName: string | null };
  comments: Comment[];
}

const FIELDS: { label: string; key: keyof ApplicationDetail }[] = [
  { label: "Race", key: "race" },
  { label: "Niveau", key: "level" },
  { label: "Add-ons utilisés", key: "addons" },
  { label: "Expériences de jeu", key: "experience" },
  { label: "Objectifs", key: "goals" },
  { label: "Objectifs PvP", key: "pvpGoals" },
  { label: "Comment as-tu découvert la guilde / pourquoi la rejoindre", key: "discoverySource" },
  { label: "Connaissances chez Wraith", key: "knownMembers" }
];

export default function CandidatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const isStaff = session?.user.siteRole === "OFFICIER" || session?.user.siteRole === "ADMINISTRATEUR";

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [internalDraft, setInternalDraft] = useState("");
  const [sharedDraft, setSharedDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/applications/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setApplication(data);
        setLoading(false);
      });
  }, [id]);

  async function postComment(visibility: "INTERNE" | "PARTAGE", body: string) {
    if (!body.trim() || !application) return;
    setSending(true);
    const res = await fetch(`/api/applications/${application.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility, body })
    });
    const comment = await res.json();
    setSending(false);
    if (res.ok) {
      setApplication({ ...application, comments: [...application.comments, comment] });
      if (visibility === "INTERNE") setInternalDraft("");
      else setSharedDraft("");
    }
  }

  async function changeStatus(status: string) {
    if (!application) return;
    const res = await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    if (res.ok) setApplication({ ...application, status });
  }

  if (loading) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;
  if (!application) return <p className="font-ui text-sm text-bone/50">Candidature introuvable.</p>;

  const status = STATUS_STYLE[application.status];
  const internalComments = application.comments.filter((c) => c.visibility === "INTERNE");
  const sharedComments = application.comments.filter((c) => c.visibility === "PARTAGE");

  return (
    <div className="space-y-6">
      <div className="war-border bg-char p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ClassSpecIcon wowClass={application.wowClass} spec={application.spec} size="h-7 w-7" />
            <div>
              <p className="font-display text-lg text-bone">{application.characterName}</p>
              <p className="font-ui text-xs text-bone/55">
                {CLASS_LABELS[application.wowClass]} ({application.spec}) ·{" "}
                {application.user.displayName || application.user.discordTag}
              </p>
            </div>
          </div>
          <span className={`font-ui text-[10px] uppercase tracking-wide px-2 py-1 ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        {isStaff && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => changeStatus("ACCEPTEE")}
              className="font-ui text-xs px-3 py-1.5 border border-moss text-moss focus-ring"
            >
              Accepter
            </button>
            <button
              onClick={() => changeStatus("REFUSEE")}
              className="font-ui text-xs px-3 py-1.5 border border-blood text-blood focus-ring"
            >
              Refuser
            </button>
            <button
              onClick={() => changeStatus("EN_ATTENTE")}
              className="font-ui text-xs px-3 py-1.5 border border-bone/30 text-bone/70 focus-ring"
            >
              Remettre en attente
            </button>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div>
            <p className="font-ui text-xs uppercase tracking-wide text-bone/40">Contact Discord</p>
            <p className="font-ui text-sm text-bone">{application.discordTag}</p>
          </div>
          <div>
            <p className="font-ui text-xs uppercase tracking-wide text-bone/40">Professions</p>
            <p className="font-ui text-sm text-bone">
              {application.professions.map((p) => PROFESSION_LABELS[p]).join(", ") || "—"}
            </p>
          </div>
          <div>
            <p className="font-ui text-xs uppercase tracking-wide text-bone/40">Lien UI</p>
            <a
              href={application.uiScreenshotUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-ui text-sm text-bone underline break-all"
            >
              {application.uiScreenshotUrl}
            </a>
          </div>
          <div>
            <p className="font-ui text-xs uppercase tracking-wide text-bone/40">Disponibilités</p>
            <p className="font-ui text-sm text-bone">
              {application.nightsPerWeek} soir(s)/semaine — {application.availableNights.join(", ")}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <p className="font-ui text-xs uppercase tracking-wide text-bone/40">{f.label}</p>
              <p className="font-ui text-sm text-bone whitespace-pre-line">{String(application[f.key] ?? "")}</p>
            </div>
          ))}
          {application.extra && (
            <div>
              <p className="font-ui text-xs uppercase tracking-wide text-bone/40">Informations complémentaires</p>
              <p className="font-ui text-sm text-bone whitespace-pre-line">{application.extra}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="war-border bg-char p-5">
          <p className="font-display text-sm text-bone mb-3">Notes internes</p>
          <p className="font-ui text-[10px] text-bone/40 mb-3">Jamais visible du candidat.</p>
          <div className="space-y-3 mb-4">
            {internalComments.length === 0 ? (
              <p className="font-ui text-xs text-bone/40">Aucune note pour le moment.</p>
            ) : (
              internalComments.map((c) => (
                <div key={c.id} className="border-l-2 border-bone/15 pl-3">
                  <p className="font-ui text-xs text-bone/50">
                    {c.author.displayName || c.author.discordTag} ·{" "}
                    {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="font-ui text-sm text-bone whitespace-pre-line">{c.body}</p>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={internalDraft}
              onChange={(e) => setInternalDraft(e.target.value)}
              placeholder="Note interne..."
              className="flex-1 bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
            />
            <button
              onClick={() => postComment("INTERNE", internalDraft)}
              disabled={sending}
              className="font-display text-xs bg-blood text-void font-medium px-4 py-2 disabled:opacity-50 focus-ring"
            >
              Envoyer
            </button>
          </div>
        </div>

        <div className="war-border bg-char p-5">
          <p className="font-display text-sm text-bone mb-3">Échange avec le candidat</p>
          <p className="font-ui text-[10px] text-bone/40 mb-3">Visible et modifiable par le candidat.</p>
          <div className="space-y-3 mb-4">
            {sharedComments.length === 0 ? (
              <p className="font-ui text-xs text-bone/40">Aucun message pour le moment.</p>
            ) : (
              sharedComments.map((c) => (
                <div key={c.id} className="border-l-2 border-bone/15 pl-3">
                  <p className="font-ui text-xs text-bone/50">
                    {c.author.displayName || c.author.discordTag} ·{" "}
                    {new Date(c.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="font-ui text-sm text-bone whitespace-pre-line">{c.body}</p>
                </div>
              ))
            )}
          </div>
          {isStaff ? (
            <div className="flex gap-2">
              <input
                value={sharedDraft}
                onChange={(e) => setSharedDraft(e.target.value)}
                placeholder="Message au candidat..."
                className="flex-1 bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
              />
              <button
                onClick={() => postComment("PARTAGE", sharedDraft)}
                disabled={sending}
                className="font-display text-xs bg-blood text-void font-medium px-4 py-2 disabled:opacity-50 focus-ring"
              >
                Envoyer
              </button>
            </div>
          ) : (
            <p className="font-ui text-xs text-bone/40">Seuls les officiers peuvent répondre ici.</p>
          )}
        </div>
      </div>
    </div>
  );
}
