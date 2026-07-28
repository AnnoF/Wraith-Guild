"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { RAID_INSTANCES } from "@/lib/raidInstances";
import { youtubeEmbedUrl } from "@/lib/youtube";

interface GuideEntry {
  id: string;
  raidTitle: string;
  bossName: string;
  videoUrl: string | null;
  notes: string | null;
  order: number;
}

export default function GuidePage() {
  const { data: session } = useSession();
  const isStaff = session?.user.siteRole === "OFFICIER" || session?.user.siteRole === "ADMINISTRATEUR";

  const [entries, setEntries] = useState<GuideEntry[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    fetch("/api/guide")
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      });
  }

  useEffect(load, []);

  if (loading) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  return (
    <div className="space-y-10">
      <p className="font-display text-lg text-bone">Guides de raid</p>

      {RAID_INSTANCES.map((instance) => (
        <GuideSection
          key={instance}
          instance={instance}
          entries={entries.filter((e) => e.raidTitle === instance)}
          isStaff={isStaff}
          onChange={load}
        />
      ))}
    </div>
  );
}

function GuideSection({
  instance,
  entries,
  isStaff,
  onChange
}: {
  instance: string;
  entries: GuideEntry[];
  isStaff: boolean;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <p className="font-display text-sm text-blood uppercase tracking-wide">{instance}</p>
        {isStaff && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="font-ui text-xs text-bone/50 hover:text-bone focus-ring"
          >
            {adding ? "Annuler" : "+ Ajouter un boss"}
          </button>
        )}
      </div>

      {adding && (
        <GuideEntryForm
          raidTitle={instance}
          onDone={() => {
            setAdding(false);
            onChange();
          }}
        />
      )}

      {entries.length === 0 && !adding ? (
        <p className="font-ui text-sm text-bone/40">Pas encore de guide pour cette instance.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <GuideEntryCard key={entry.id} entry={entry} isStaff={isStaff} onChange={onChange} />
          ))}
        </div>
      )}
    </section>
  );
}

function GuideEntryCard({
  entry,
  isStaff,
  onChange
}: {
  entry: GuideEntry;
  isStaff: boolean;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const embedUrl = entry.videoUrl ? youtubeEmbedUrl(entry.videoUrl) : null;

  async function handleDelete() {
    if (!confirm(`Retirer "${entry.bossName}" du guide ?`)) return;
    await fetch(`/api/guide/${entry.id}`, { method: "DELETE" });
    onChange();
  }

  if (editing) {
    return (
      <GuideEntryForm
        raidTitle={entry.raidTitle}
        existing={entry}
        onDone={() => {
          setEditing(false);
          onChange();
        }}
      />
    );
  }

  return (
    <div className="war-border bg-char p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="font-display text-sm text-bone">{entry.bossName}</p>
        {isStaff && (
          <div className="flex gap-2">
            <button onClick={() => setEditing(true)} className="font-ui text-xs text-bone/50 hover:text-bone focus-ring">
              Éditer
            </button>
            <button onClick={handleDelete} className="font-ui text-xs text-blood/70 hover:text-blood focus-ring">
              Retirer
            </button>
          </div>
        )}
      </div>

      {embedUrl ? (
        <div className="aspect-video mb-2">
          <iframe src={embedUrl} allowFullScreen className="h-full w-full" />
        </div>
      ) : (
        entry.videoUrl && (
          <a
            href={entry.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-ui text-xs text-bone/70 underline break-all block mb-2"
          >
            {entry.videoUrl}
          </a>
        )
      )}

      {entry.notes && <p className="font-ui text-xs text-bone/60 whitespace-pre-line">{entry.notes}</p>}
    </div>
  );
}

function GuideEntryForm({
  raidTitle,
  existing,
  onDone
}: {
  raidTitle: string;
  existing?: GuideEntry;
  onDone: () => void;
}) {
  const [bossName, setBossName] = useState(existing?.bossName ?? "");
  const [videoUrl, setVideoUrl] = useState(existing?.videoUrl ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!bossName.trim()) {
      setError("Le nom du boss est obligatoire.");
      return;
    }
    setSaving(true);
    const res = existing
      ? await fetch(`/api/guide/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bossName, videoUrl: videoUrl || null, notes: notes || null })
        })
      : await fetch("/api/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raidTitle, bossName, videoUrl: videoUrl || null, notes: notes || null })
        });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erreur lors de l'enregistrement.");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="war-border bg-char p-4 space-y-2 mb-4">
      {error && <p className="font-ui text-xs text-blood">{error}</p>}
      <input
        value={bossName}
        onChange={(e) => setBossName(e.target.value)}
        placeholder="Nom du boss"
        className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
      />
      <input
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Lien vidéo (optionnel)"
        className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optionnel)"
        rows={2}
        className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
      />
      <button
        type="submit"
        disabled={saving}
        className="font-display text-xs bg-blood text-void font-medium px-4 py-2 disabled:opacity-50 focus-ring"
      >
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </form>
  );
}
