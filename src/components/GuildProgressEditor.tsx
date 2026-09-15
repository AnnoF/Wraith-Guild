"use client";
import { useState } from "react";

interface ProgressEntry {
  id: string;
  instance: string;
  killed: number;
  total: number;
}

export default function GuildProgressEditor({
  initialEntries,
  isAdmin
}: {
  initialEntries: ProgressEntry[];
  isAdmin: boolean;
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [adding, setAdding] = useState(false);

  function refresh() {
    fetch("/api/guild-progress")
      .then((res) => res.json())
      .then(setEntries);
  }

  return (
    <div className="space-y-3">
      {entries.length === 0 && !adding && (
        <p className="font-ui text-sm text-bone/50">Progression à venir.</p>
      )}
      {entries.map((entry) => (
        <ProgressCard key={entry.id} entry={entry} isAdmin={isAdmin} onChange={refresh} />
      ))}
      {isAdmin &&
        (adding ? (
          <ProgressForm
            onDone={() => {
              setAdding(false);
              refresh();
            }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="font-ui text-xs text-bone/50 hover:text-bone focus-ring"
          >
            + Ajouter une instance
          </button>
        ))}
    </div>
  );
}

function ProgressCard({
  entry,
  isAdmin,
  onChange
}: {
  entry: ProgressEntry;
  isAdmin: boolean;
  onChange: () => void;
}) {
  const [editing, setEditing] = useState(false);

  async function handleDelete() {
    if (!confirm(`Retirer "${entry.instance}" de la progression ?`)) return;
    await fetch(`/api/guild-progress/${entry.id}`, { method: "DELETE" });
    onChange();
  }

  if (editing) {
    return (
      <ProgressForm
        existing={entry}
        onDone={() => {
          setEditing(false);
          onChange();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="bg-char border border-bone/10 rounded-sm p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="font-display text-sm text-bone">{entry.instance}</p>
        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(true)} className="font-ui text-xs text-bone/50 hover:text-bone focus-ring">
              Éditer
            </button>
            <button onClick={handleDelete} className="font-ui text-xs text-garnet/70 hover:text-garnet focus-ring">
              Retirer
            </button>
          </div>
        )}
      </div>
      <div className="h-1.5 w-full bg-void mb-2">
        <div
          className={`h-1.5 ${entry.killed >= entry.total ? "bg-amber" : "bg-garnet"}`}
          style={{ width: `${(entry.killed / entry.total) * 100}%` }}
        />
      </div>
      <p className="font-ui text-xs text-bone/60">
        {entry.killed} / {entry.total}
      </p>
    </div>
  );
}

function ProgressForm({
  existing,
  onDone,
  onCancel
}: {
  existing?: ProgressEntry;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [instance, setInstance] = useState(existing?.instance ?? "");
  const [killed, setKilled] = useState(existing ? String(existing.killed) : "0");
  const [total, setTotal] = useState(existing ? String(existing.total) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const killedNum = Number(killed);
    const totalNum = Number(total);
    if (!instance.trim()) {
      setError("Le nom de l'instance est obligatoire.");
      return;
    }
    if (!Number.isInteger(killedNum) || !Number.isInteger(totalNum) || killedNum < 0 || totalNum < 1 || killedNum > totalNum) {
      setError("Progression invalide (tués/total).");
      return;
    }

    setSaving(true);
    const payload = { instance, killed: killedNum, total: totalNum };
    const res = existing
      ? await fetch(`/api/guild-progress/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        })
      : await fetch("/api/guild-progress", {
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
    <form onSubmit={handleSubmit} className="gilt-frame rounded-sm bg-char p-4 space-y-2">
      {error && <p className="font-ui text-xs text-garnet">{error}</p>}
      <input
        value={instance}
        onChange={(e) => setInstance(e.target.value)}
        placeholder="Instance (ex: Molten Core)"
        className="w-full bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
      />
      <div className="flex gap-2">
        <input
          type="number"
          min={0}
          value={killed}
          onChange={(e) => setKilled(e.target.value)}
          placeholder="Tués"
          className="w-1/2 bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
        />
        <input
          type="number"
          min={1}
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder="Total"
          className="w-1/2 bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="font-display text-xs bg-gold text-void font-medium rounded-full px-4 py-2 disabled:opacity-50 focus-ring"
        >
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button type="button" onClick={onCancel} className="font-ui text-xs text-bone/50 hover:text-bone focus-ring">
          Annuler
        </button>
      </div>
    </form>
  );
}
