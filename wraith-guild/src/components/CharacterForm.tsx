"use client";
import { useState } from "react";
import { WOW_CLASSES, CLASS_LABELS, CLASS_SPECS, type WowClass } from "@/lib/classes";

export default function CharacterForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [wowClass, setWowClass] = useState<WowClass | "">("");
  const [spec, setSpec] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const availableSpecs = wowClass ? CLASS_SPECS[wowClass] : [];

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
        body: JSON.stringify({ name, wowClass, spec })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }
      setName("");
      setWowClass("");
      setSpec("");
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
          <option value="">— Choisir —</option>
          {WOW_CLASSES.map((c) => (
            <option key={c} value={c}>
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
          <option value="">— Choisir —</option>
          {availableSpecs.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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
