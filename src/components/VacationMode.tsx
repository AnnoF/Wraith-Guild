"use client";
import { useEffect, useState } from "react";

interface MeProfile {
  vacationStart: string | null;
  vacationEnd: string | null;
}

export default function VacationMode() {
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    fetch("/api/me")
      .then((res) => res.json())
      .then(setProfile);
  }

  useEffect(load, []);

  const today = new Date().toISOString().slice(0, 10);
  const isActive = !!profile?.vacationEnd && profile.vacationEnd.slice(0, 10) >= today;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!start || !end) {
      setError("Les deux dates sont obligatoires.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vacationStart: start, vacationEnd: end })
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erreur lors de l'enregistrement.");
      return;
    }
    setStart("");
    setEnd("");
    load();
  }

  async function disable() {
    setSaving(true);
    await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vacationStart: null, vacationEnd: null })
    });
    setSaving(false);
    load();
  }

  if (!profile) return null;

  return (
    <div className="war-border bg-char p-5">
      <p className="font-display text-sm text-bone mb-2">Mode vacances</p>
      {isActive ? (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="font-ui text-sm text-bone/70">
            Actif du{" "}
            {new Date(profile.vacationStart!).toLocaleDateString("fr-FR")} au{" "}
            {new Date(profile.vacationEnd!).toLocaleDateString("fr-FR")}. Vous serez inscrit·e automatiquement en
            absent sur les raids de cette période.
          </p>
          <button
            onClick={disable}
            disabled={saving}
            className="font-ui text-xs text-blood/70 hover:text-blood focus-ring disabled:opacity-50"
          >
            Désactiver
          </button>
        </div>
      ) : (
        <form onSubmit={save} className="flex flex-wrap items-end gap-3">
          <p className="font-ui text-xs text-bone/50 basis-full">
            Vous serez inscrit·e automatiquement en absent sur les raids qui tombent dans cette période.
          </p>
          {error && <p className="font-ui text-xs text-blood basis-full">{error}</p>}
          <div>
            <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">Du</label>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
            />
          </div>
          <div>
            <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">Au</label>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="font-display text-xs bg-blood text-void font-medium px-4 py-2.5 disabled:opacity-50 focus-ring"
          >
            Activer
          </button>
        </form>
      )}
    </div>
  );
}
