"use client";
import { useState } from "react";
import { CLASS_LABELS, CLASS_SPECS, type WowClass } from "@/lib/classes";
import { PROFESSIONS, PROFESSION_LABELS, MAX_PROFESSIONS_PER_CHARACTER, type Profession } from "@/lib/professions";

export interface CharacterData {
  id: string;
  name: string;
  class: WowClass;
  spec: string;
  isActive: boolean;
  professions: { profession: Profession; isMaxed: boolean }[];
}

interface ProfessionSelection {
  profession: Profession;
  isMaxed: boolean;
}

export default function CharacterCard({
  character,
  onToggleActive,
  onUpdated
}: {
  character: CharacterData;
  onToggleActive: (id: string, isActive: boolean) => void;
  onUpdated: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(character.name);
  const [spec, setSpec] = useState(character.spec);
  const [professions, setProfessions] = useState<ProfessionSelection[]>(
    character.professions.map((p) => ({ profession: p.profession, isMaxed: p.isMaxed }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSpecs = CLASS_SPECS[character.class];

  function startEditing() {
    setName(character.name);
    setSpec(character.spec);
    setProfessions(character.professions.map((p) => ({ profession: p.profession, isMaxed: p.isMaxed })));
    setError(null);
    setEditing(true);
  }

  function toggleProfession(profession: Profession) {
    setProfessions((prev) => {
      if (prev.some((p) => p.profession === profession)) {
        return prev.filter((p) => p.profession !== profession);
      }
      if (prev.length >= MAX_PROFESSIONS_PER_CHARACTER) return prev;
      return [...prev, { profession, isMaxed: false }];
    });
  }

  function toggleMaxed(profession: Profession) {
    setProfessions((prev) =>
      prev.map((p) => (p.profession === profession ? { ...p, isMaxed: !p.isMaxed } : p))
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Le nom du personnage est obligatoire.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/characters/${character.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), spec, professions })
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erreur lors de la mise à jour.");
      return;
    }
    setEditing(false);
    onUpdated();
  }

  if (editing) {
    return (
      <div className="war-border bg-char p-4 space-y-3">
        {error && <p className="font-ui text-xs text-blood">{error}</p>}

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
            Nom du personnage
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
        </div>

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
            Spécialisation
          </label>
          <select
            value={spec}
            onChange={(e) => setSpec(e.target.value)}
            className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
          >
            {availableSpecs.map((s) => (
              <option key={s} value={s} className="bg-void text-bone">
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
            Métiers ({professions.length}/{MAX_PROFESSIONS_PER_CHARACTER})
          </label>
          <div className="space-y-1">
            {PROFESSIONS.map((p) => {
              const selection = professions.find((x) => x.profession === p);
              const disabled = !selection && professions.length >= MAX_PROFESSIONS_PER_CHARACTER;
              return (
                <div key={p}>
                  <label
                    className={`flex items-center gap-2 font-ui text-sm ${
                      disabled ? "text-bone/30" : "text-bone/80"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!selection}
                      disabled={disabled}
                      onChange={() => toggleProfession(p)}
                      className="accent-blood"
                    />
                    {PROFESSION_LABELS[p]}
                  </label>
                  {selection && (
                    <label className="flex items-center gap-1 font-ui text-xs text-bone/50 ml-6 mt-1">
                      <input
                        type="checkbox"
                        checked={selection.isMaxed}
                        onChange={() => toggleMaxed(p)}
                        className="accent-blood"
                      />
                      Maxed
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-display text-xs bg-blood text-void font-medium px-4 py-2 disabled:opacity-50 focus-ring"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="font-ui text-xs text-bone/50 hover:text-bone focus-ring underline"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`war-border bg-char p-4 flex items-center justify-between ${!character.isActive ? "opacity-50" : ""}`}>
      <div>
        <p className="font-display text-sm text-bone">{character.name}</p>
        <p className="font-ui text-xs text-bone/60 mt-0.5">
          {CLASS_LABELS[character.class]} · {character.spec}
        </p>
        {character.professions.length > 0 && (
          <p className="font-ui text-xs text-bone/40 mt-0.5">
            {character.professions
              .map((p) => `${PROFESSION_LABELS[p.profession]}${p.isMaxed ? " (max)" : ""}`)
              .join(" · ")}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={startEditing}
          className="font-ui text-xs text-bone/50 hover:text-bone focus-ring underline"
        >
          Éditer
        </button>
        <button
          onClick={() => onToggleActive(character.id, !character.isActive)}
          className="font-ui text-xs text-bone/50 hover:text-bone focus-ring underline"
        >
          {character.isActive ? "Archiver" : "Réactiver"}
        </button>
      </div>
    </div>
  );
}
