"use client";
import { useEffect, useState } from "react";
import SignInButton from "@/components/SignInButton";
import ClassSpecIcon from "@/components/ClassSpecIcon";
import { WOW_CLASSES, CLASS_LABELS, CLASS_SPECS, type WowClass } from "@/lib/classes";
import { PROFESSIONS, PROFESSION_LABELS, type Profession } from "@/lib/professions";
import { APPLICATION_WEEKDAYS } from "@/lib/applicationInfo";
import { DISCORD_INVITE_URL } from "@/lib/guildInfo";

const STATUS_STYLE: Record<string, { label: string; bg: string; text: string }> = {
  EN_ATTENTE: { label: "En attente", bg: "bg-amber", text: "text-void" },
  ACCEPTEE: { label: "Acceptée", bg: "bg-moss", text: "text-void" },
  REFUSEE: { label: "Refusée", bg: "bg-blood/30", text: "text-bone/70" }
};

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: { discordTag: string; displayName: string | null };
}

interface ApplicationData {
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
  comments: Comment[];
}

export default function CandidatureForm({
  loggedIn,
  defaultDiscordTag
}: {
  loggedIn: boolean;
  defaultDiscordTag: string;
}) {
  const [loading, setLoading] = useState(loggedIn);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [isGuildMember, setIsGuildMember] = useState(false);
  const [canReapply, setCanReapply] = useState(false);
  const [reapplyAvailableAt, setReapplyAvailableAt] = useState<string | null>(null);
  const [showReapplyForm, setShowReapplyForm] = useState(false);

  function loadStatus() {
    setLoading(true);
    fetch("/api/applications/me")
      .then((res) => res.json())
      .then((data) => {
        setApplication(data.application);
        setIsGuildMember(data.isGuildMember);
        setCanReapply(data.canReapply);
        setReapplyAvailableAt(data.reapplyAvailableAt);
        setLoading(false);
      });
  }

  useEffect(() => {
    if (!loggedIn) return;
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <div className="war-border bg-char p-6 text-center">
        <p className="font-ui text-sm text-bone/70 mb-4">
          Connectez-vous avec Discord pour déposer votre candidature.
        </p>
        <SignInButton callbackUrl="/candidature" label="Se connecter avec Discord pour postuler" />
      </div>
    );
  }

  if (loading) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  if (application && !showReapplyForm) {
    return (
      <ApplicationStatus
        application={application}
        setApplication={setApplication}
        canReapply={canReapply}
        reapplyAvailableAt={reapplyAvailableAt}
        onStartReapply={() => setShowReapplyForm(true)}
      />
    );
  }

  if (!isGuildMember) {
    return (
      <div className="war-border bg-char p-6 text-center">
        <p className="font-ui text-sm text-bone/70 mb-4">
          Il faut d'abord rejoindre notre Discord pour pouvoir postuler (c'est
          par là que les officiers vous répondront).
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-sm inline-flex items-center gap-2 px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] transition-colors text-white font-medium focus-ring"
          >
            Rejoindre le Discord
          </a>
          <button
            type="button"
            onClick={loadStatus}
            className="font-ui text-xs text-bone/50 hover:text-bone focus-ring"
          >
            J'ai rejoint, réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <ApplicationFormFields
      defaultDiscordTag={defaultDiscordTag}
      onSubmitted={(created) => {
        setApplication({ ...created, comments: [] });
        setShowReapplyForm(false);
      }}
    />
  );
}

function ApplicationFormFields({
  defaultDiscordTag,
  onSubmitted
}: {
  defaultDiscordTag: string;
  onSubmitted: (application: ApplicationData) => void;
}) {
  const [discordTag, setDiscordTag] = useState(defaultDiscordTag);
  const [characterName, setCharacterName] = useState("");
  const [wowClass, setWowClass] = useState<WowClass>(WOW_CLASSES[0]);
  const [spec, setSpec] = useState(CLASS_SPECS[WOW_CLASSES[0]][0]);
  const [race, setRace] = useState("");
  const [level, setLevel] = useState("");
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [addons, setAddons] = useState("");
  const [uiScreenshotUrl, setUiScreenshotUrl] = useState("");
  const [experience, setExperience] = useState("");
  const [goals, setGoals] = useState("");
  const [pvpGoals, setPvpGoals] = useState("");
  const [nightsPerWeek, setNightsPerWeek] = useState(2);
  const [availableNights, setAvailableNights] = useState<string[]>([]);
  const [discoverySource, setDiscoverySource] = useState("");
  const [knownMembers, setKnownMembers] = useState("");
  const [extra, setExtra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleProfession(p: Profession) {
    setProfessions((current) => (current.includes(p) ? current.filter((x) => x !== p) : [...current, p]));
  }
  function toggleNight(day: string) {
    setAvailableNights((current) => (current.includes(day) ? current.filter((d) => d !== day) : [...current, day]));
  }
  function handleClassChange(newClass: WowClass) {
    setWowClass(newClass);
    setSpec(CLASS_SPECS[newClass][0]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (availableNights.length === 0) {
      setError("Sélectionnez au moins un soir disponible.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        discordTag,
        characterName,
        wowClass,
        spec,
        race,
        level,
        professions,
        addons,
        uiScreenshotUrl,
        experience,
        goals,
        pvpGoals,
        nightsPerWeek,
        availableNights,
        discoverySource,
        knownMembers,
        extra: extra || null
      })
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error || "Erreur lors de l'envoi.");
      return;
    }
    onSubmitted(data);
  }

  const inputClass = "w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone";
  const labelClass = "font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1";

  return (
    <form onSubmit={handleSubmit} className="war-border bg-char p-6 space-y-5">
      <p className="font-display text-lg text-bone">Formulaire de candidature</p>
      {error && <p className="font-ui text-xs text-blood">{error}</p>}

      <div>
        <label className={labelClass}>1. Contact Discord (Tag#xxxx)</label>
        <input value={discordTag} onChange={(e) => setDiscordTag(e.target.value)} required className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>2. Nom du personnage principal</label>
        <input value={characterName} onChange={(e) => setCharacterName(e.target.value)} required className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>3. Classe</label>
          <select
            value={wowClass}
            onChange={(e) => handleClassChange(e.target.value as WowClass)}
            className={inputClass}
          >
            {WOW_CLASSES.map((c) => (
              <option key={c} value={c} className="bg-void text-bone">
                {CLASS_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Spécialisation</label>
          <select value={spec} onChange={(e) => setSpec(e.target.value)} className={inputClass}>
            {CLASS_SPECS[wowClass].map((s) => (
              <option key={s} value={s} className="bg-void text-bone">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>4. Race du personnage</label>
        <input value={race} onChange={(e) => setRace(e.target.value)} required className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>5. Niveau actuel du personnage</label>
        <input value={level} onChange={(e) => setLevel(e.target.value)} required className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>6. Professions du personnage</label>
        <div className="flex flex-wrap gap-2">
          {PROFESSIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => toggleProfession(p)}
              className={`font-ui text-xs px-3 py-1.5 border transition-colors focus-ring ${
                professions.includes(p)
                  ? "bg-blood border-blood text-void font-medium"
                  : "border-bone/15 text-bone/70 hover:border-bone/40"
              }`}
            >
              {PROFESSION_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>7. Liste des add-ons utilisés</label>
        <textarea value={addons} onChange={(e) => setAddons(e.target.value)} required rows={2} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>8. Lien vers un screenshot de votre UI</label>
        <input
          type="url"
          value={uiScreenshotUrl}
          onChange={(e) => setUiScreenshotUrl(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>9. Expériences de jeu (rôle dans votre guilde et avancée PvE)</label>
        <textarea value={experience} onChange={(e) => setExperience(e.target.value)} required rows={3} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>10. Quels sont vos objectifs ?</label>
        <textarea value={goals} onChange={(e) => setGoals(e.target.value)} required rows={3} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>11. As-tu des objectifs PvP ?</label>
        <textarea value={pvpGoals} onChange={(e) => setPvpGoals(e.target.value)} required rows={2} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>12. Combien de soirs par semaine es-tu disponible pour les raids de 20h00 à 0h00 ?</label>
        <input
          type="number"
          min={1}
          max={7}
          value={nightsPerWeek}
          onChange={(e) => setNightsPerWeek(Number(e.target.value))}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>13. Quels sont ces soirs ?</label>
        <div className="flex flex-wrap gap-2">
          {APPLICATION_WEEKDAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleNight(day)}
              className={`font-ui text-xs px-3 py-1.5 border transition-colors focus-ring ${
                availableNights.includes(day)
                  ? "bg-blood border-blood text-void font-medium"
                  : "border-bone/15 text-bone/70 hover:border-bone/40"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelClass}>14. Comment as-tu découvert la guilde Wraith et pourquoi vouloir la rejoindre ?</label>
        <textarea
          value={discoverySource}
          onChange={(e) => setDiscoverySource(e.target.value)}
          required
          rows={3}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>15. As-tu des connaissances chez Wraith ?</label>
        <textarea value={knownMembers} onChange={(e) => setKnownMembers(e.target.value)} required rows={2} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>16. Champ libre si tu as des informations à ajouter (optionnel)</label>
        <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={2} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="font-display text-sm bg-blood text-void font-medium px-5 py-2.5 disabled:opacity-50 focus-ring"
      >
        {submitting ? "Envoi..." : "Envoyer ma candidature"}
      </button>
    </form>
  );
}

function ApplicationStatus({
  application,
  setApplication,
  canReapply,
  reapplyAvailableAt,
  onStartReapply
}: {
  application: ApplicationData;
  setApplication: (a: ApplicationData) => void;
  canReapply: boolean;
  reapplyAvailableAt: string | null;
  onStartReapply: () => void;
}) {
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const status = STATUS_STYLE[application.status];

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    const res = await fetch(`/api/applications/${application.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visibility: "PARTAGE", body: reply })
    });
    const comment = await res.json();
    setSending(false);
    if (res.ok) {
      setApplication({ ...application, comments: [...application.comments, comment] });
      setReply("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="war-border bg-char p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="font-display text-lg text-bone">Votre candidature</p>
          <span className={`font-ui text-[10px] uppercase tracking-wide px-2 py-1 ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <ClassSpecIcon wowClass={application.wowClass} spec={application.spec} size="h-6 w-6" />
          <p className="font-ui text-sm text-bone">
            {application.characterName} — {CLASS_LABELS[application.wowClass]} ({application.spec})
          </p>
        </div>
        <p className="font-ui text-xs text-bone/50">
          Candidature envoyée le{" "}
          {new Date(application.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
        </p>

        {application.status === "REFUSEE" && (
          <div className="mt-4 pt-4 border-t border-bone/10">
            {canReapply ? (
              <>
                <p className="font-ui text-xs text-bone/60 mb-3">
                  Vous pouvez déposer une nouvelle candidature.
                </p>
                <button
                  type="button"
                  onClick={onStartReapply}
                  className="font-display text-xs bg-blood text-void font-medium px-4 py-2 focus-ring"
                >
                  Déposer une nouvelle candidature
                </button>
              </>
            ) : (
              reapplyAvailableAt && (
                <p className="font-ui text-xs text-bone/50">
                  Vous pourrez déposer une nouvelle candidature à partir du{" "}
                  {new Date(reapplyAvailableAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                  .
                </p>
              )
            )}
          </div>
        )}
      </div>

      <div className="war-border bg-char p-6">
        <p className="font-display text-sm text-bone mb-3">Échange avec les officiers</p>
        <div className="space-y-3 mb-4">
          {application.comments.length === 0 ? (
            <p className="font-ui text-xs text-bone/40">Aucun message pour le moment.</p>
          ) : (
            application.comments.map((c) => (
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
        <form onSubmit={handleReply} className="flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Votre message..."
            className="flex-1 bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
          <button
            type="submit"
            disabled={sending}
            className="font-display text-xs bg-blood text-void font-medium px-4 py-2 disabled:opacity-50 focus-ring"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
