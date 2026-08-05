"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { youtubeEmbedUrl } from "@/lib/youtube";
import LightboxImage from "@/components/LightboxImage";

interface HallOfFameEntry {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  eventDate: string | null;
  createdAt: string;
}

export default function HallOfFamePage() {
  const { data: session } = useSession();
  const isStaff = session?.user.siteRole === "OFFICIER" || session?.user.siteRole === "ADMINISTRATEUR";

  const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  function load() {
    fetch("/api/hall-of-fame")
      .then((res) => res.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      });
  }

  useEffect(load, []);

  if (loading) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg text-bone">Hall of Fame</p>
          <p className="font-ui text-xs text-bone/50 mt-1">
            Premiers down, équipements légendaires, remerciements... les moments qui marquent l&apos;histoire de la guilde.
          </p>
        </div>
        {isStaff && (
          <button
            onClick={() => setAdding((v) => !v)}
            className="font-ui text-xs text-bone/50 hover:text-bone focus-ring shrink-0"
          >
            {adding ? "Annuler" : "+ Ajouter un souvenir"}
          </button>
        )}
      </div>

      {adding && (
        <EntryForm
          onDone={() => {
            setAdding(false);
            load();
          }}
        />
      )}

      {entries.length === 0 && !adding ? (
        <p className="font-ui text-sm text-bone/40">Pas encore de souvenir enregistré.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} isStaff={isStaff} onChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function EntryCard({
  entry,
  isStaff,
  onChange
}: {
  entry: HallOfFameEntry;
  isStaff: boolean;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const embedUrl = entry.videoUrl ? youtubeEmbedUrl(entry.videoUrl) : null;

  async function handleDelete() {
    if (!confirm(`Retirer "${entry.title}" du Hall of Fame ?`)) return;
    await fetch(`/api/hall-of-fame/${entry.id}`, { method: "DELETE" });
    onChange();
  }

  if (editing) {
    return (
      <EntryForm
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
      <div className="flex items-center justify-between mb-2 gap-2">
        <div>
          <p className="font-display text-sm text-bone">{entry.title}</p>
          {entry.eventDate && (
            <p className="font-ui text-[10px] text-amber uppercase tracking-wide mt-0.5">
              {new Date(entry.eventDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>
        {isStaff && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(true)} className="font-ui text-xs text-bone/50 hover:text-bone focus-ring">
              Éditer
            </button>
            <button onClick={handleDelete} className="font-ui text-xs text-blood/70 hover:text-blood focus-ring">
              Retirer
            </button>
          </div>
        )}
      </div>

      {entry.imageUrl && (
        <LightboxImage src={entry.imageUrl} className="w-full h-48 object-cover mb-2" />
      )}

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

      {entry.description && <p className="font-ui text-xs text-bone/60 whitespace-pre-line">{entry.description}</p>}
    </div>
  );
}

function EntryForm({
  existing,
  onDone
}: {
  existing?: HallOfFameEntry;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(existing?.title ?? "");
  const [eventDate, setEventDate] = useState(existing?.eventDate ? existing.eventDate.slice(0, 10) : "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(existing?.videoUrl ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }
    setSaving(true);

    let imageUrl = existing?.imageUrl ?? null;
    if (imageFile) {
      const form = new FormData();
      form.set("file", imageFile);
      const uploadRes = await fetch("/api/hall-of-fame/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok) {
        setSaving(false);
        setError(uploadData.error || "Erreur lors de l'upload de l'image.");
        return;
      }
      imageUrl = uploadData.url;
    }

    const payload = {
      title,
      description: description || null,
      videoUrl: videoUrl || null,
      eventDate: eventDate || null,
      imageUrl
    };

    const res = existing
      ? await fetch(`/api/hall-of-fame/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      : await fetch("/api/hall-of-fame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
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
    <form onSubmit={handleSubmit} className="war-border bg-char p-4 space-y-2">
      {error && <p className="font-ui text-xs text-blood">{error}</p>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre (ex: Premier down Ragnaros)"
        className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
      />
      <input
        type="date"
        value={eventDate}
        onChange={(e) => setEventDate(e.target.value)}
        className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Texte explicatif (optionnel)"
        rows={3}
        className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
      />
      <input
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        placeholder="Lien vidéo (optionnel)"
        className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
      />
      <div>
        <label className="block font-ui text-xs text-bone/50 mb-1">
          Screenshot (optionnel, jpg/png/webp/gif, 8 Mo max)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          className="w-full font-ui text-xs text-bone/70"
        />
        {existing?.imageUrl && !imageFile && (
          <p className="font-ui text-[10px] text-bone/40 mt-1">Une image est déjà associée à ce souvenir ; en choisir une nouvelle la remplacera.</p>
        )}
      </div>
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
