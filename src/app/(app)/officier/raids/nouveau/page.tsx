"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RAID_INSTANCES, RAID_INSTANCE_SIZES, type RaidInstance } from "@/lib/raidInstances";

function isRaidInstance(value: string | null): value is RaidInstance {
  return !!value && (RAID_INSTANCES as string[]).includes(value);
}

export default function NouveauRaidPage() {
  return (
    <Suspense fallback={<p className="font-ui text-sm text-bone/50">Chargement...</p>}>
      <NouveauRaidForm />
    </Suspense>
  );
}

function NouveauRaidForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTitle = searchParams.get("title");
  const [title, setTitle] = useState<string>(isRaidInstance(prefillTitle) ? prefillTitle : RAID_INSTANCES[0]);
  const [date, setDate] = useState("");
  const [signupDeadline, setSignupDeadline] = useState("");
  const [notes, setNotes] = useState(searchParams.get("notes") ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date) {
      setError("La date est obligatoire.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/raids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, date, signupDeadline: signupDeadline || null, notes })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erreur lors de la création.");
      return;
    }
    router.push(`/officier/raids/${data.id}/composition`);
  }

  return (
    <div className="max-w-lg space-y-6">
      <p className="font-display text-lg text-bone">Configurer un nouveau raid</p>

      <form onSubmit={handleSubmit} className="war-border bg-char p-5 space-y-4">
        {error && <p className="font-ui text-xs text-blood">{error}</p>}

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">Raid</label>
          <select
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
          >
            {RAID_INSTANCES.map((r) => (
              <option key={r} value={r} className="bg-void text-bone">
                {r}
              </option>
            ))}
          </select>
          <p className="font-ui text-xs text-bone/40 mt-1">
            Taille : {RAID_INSTANCE_SIZES[title]} joueurs
          </p>
        </div>

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">Date et heure</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
        </div>

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
            Date limite d'inscription (optionnel)
          </label>
          <input
            type="datetime-local"
            value={signupDeadline}
            onChange={(e) => setSignupDeadline(e.target.value)}
            className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
          <p className="font-ui text-xs text-bone/40 mt-1">
            Passé cette date, les inscriptions se ferment automatiquement.
          </p>
        </div>

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
            Notes (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="font-display text-sm bg-blood text-void font-medium px-5 py-2.5 disabled:opacity-50 focus-ring"
        >
          {loading ? "Création..." : "Créer le raid"}
        </button>
      </form>
    </div>
  );
}
