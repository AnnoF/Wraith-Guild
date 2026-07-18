"use client";
import { useState } from "react";
import { WOW_CLASSES, CLASS_LABELS, CLASS_SPECS, type WowClass } from "@/lib/classes";
import { PROFESSIONS, PROFESSION_LABELS, MAX_PROFESSIONS_PER_CHARACTER, type Profession } from "@/lib/professions";

interface ProfessionSelection {
  profession: Profession;
  isMaxed: boolean;
}

export default function CharacterForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [wowClass, setWowClass] = useState<WowClass | "">("");
  const [spec, setSpec] = useState("");
  const [professions, setProfessions] = useState<ProfessionSelection[]>([]);
  const [canRaidLead, setCanRaidLead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableSpecs = wowClass ? CLASS_SPECS[wowClass] : [];

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !wowClass || !spec) {
      setError("Merci de remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, wowClass, spec, professions, canRaidLead })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }
      setName("");
      setWowClass("");
      setSpec("");
      setProfessions([]);
      setCanRaidLead(false);
      onCreated();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="war-border bg-char p-5 space-y-4">
      <p className="font-display text-sm text-bone">Nouveau personnage</p>

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
          placeholder="Ex. Thragosh"
        />
      </div>

      <div>
        <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
          Classe
        </label>
        <select
          value={wowClass}
          onChange={(e) => {
            setWowClass(e.target.value as WowClass);
            setSpec("");
          }}
          className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
        >
          <option value="" className="bg-void text-bone">
            — Choisir —
          </option>
          {WOW_CLASSES.map((c) => (
            <option key={c} value={c} className="bg-void text-bone">
              {CLASS_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
          Spécialisation
        </label>
        <select
          value={spec}
          onChange={(e) => setSpec(e.target.value)}
          disabled={!wowClass}
          className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone disabled:opacity-40"
        >
          <option value="" className="bg-void text-bone">
            — Choisir —
          </option>
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

      <div>
        <label className="flex items-center gap-2 font-ui text-sm text-bone/80">
          <input
            type="checkbox"
            checked={canRaidLead}
            onChange={(e) => setCanRaidLead(e.target.checked)}
            className="accent-blood"
          />
          Capable de raid lead (RL)
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="font-display text-sm bg-blood text-void font-medium px-5 py-2.5 disabled:opacity-50 focus-ring"
      >
        {loading ? "Création..." : "Créer le personnage"}
      </button>
    </form>
  );
}
