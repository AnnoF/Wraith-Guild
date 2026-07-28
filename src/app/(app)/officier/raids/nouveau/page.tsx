"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RAID_INSTANCES, RAID_INSTANCE_SIZES, type RaidInstance } from "@/lib/raidInstances";

function isRaidInstance(value: string): value is RaidInstance {
  return (RAID_INSTANCES as string[]).includes(value);
}

// Calcule "date - jours" en restant en heure locale (pas de passage par
// toISOString ici, pour ne pas réintroduire le décalage de fuseau déjà
// corrigé ailleurs) — le format datetime-local n'a pas de fuseau, on
// manipule directement ses composants.
function subtractDaysLocal(datetimeLocal: string, days: number): string {
  const [datePart, timePart] = datetimeLocal.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const d = new Date(year, month - 1, day, hour, minute);
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  const prefillTitles = (searchParams.get("titles") ?? "").split(",").filter(isRaidInstance);
  const [titles, setTitles] = useState<string[]>(prefillTitles);
  const [date, setDate] = useState("");
  const [signupDeadline, setSignupDeadline] = useState("");
  const [deadlineTouched, setDeadlineTouched] = useState(false);
  const [notes, setNotes] = useState(searchParams.get("notes") ?? "");
  const [recurrent, setRecurrent] = useState(false);
  const [occurrences, setOccurrences] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // On ne mélange jamais deux tailles différentes le même soir (ex: pas de
  // 40 et 20 en même temps) : une fois une instance choisie, les autres
  // tailles deviennent indisponibles.
  const selectedSize = titles.length > 0 ? RAID_INSTANCE_SIZES[titles[0]] : null;

  function toggleTitle(title: string) {
    setTitles((current) =>
      current.includes(title) ? current.filter((t) => t !== title) : [...current, title]
    );
  }

  // Par défaut, la date limite d'inscription se cale 3 jours avant la date
  // du raid — tant que l'officier n'a pas lui-même modifié ce champ.
  function handleDateChange(value: string) {
    setDate(value);
    if (!deadlineTouched) {
      setSignupDeadline(value ? subtractDaysLocal(value, 3) : "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (titles.length === 0) {
      setError("Sélectionnez au moins un raid.");
      return;
    }
    if (!date) {
      setError("La date est obligatoire.");
      return;
    }
    if (recurrent && (!Number.isInteger(occurrences) || occurrences < 2 || occurrences > 52)) {
      setError("Le nombre d'occurrences doit être compris entre 2 et 52.");
      return;
    }
    setLoading(true);
    // Les champs datetime-local n'ont pas de fuseau horaire : le navigateur
    // les interprète dans l'heure locale de l'utilisateur (heure française
    // pour la guilde), donc c'est ici qu'il faut convertir en ISO/UTC avant
    // envoi — sinon le serveur (en UTC sur le VPS) réinterprète la même
    // chaîne comme si elle était déjà en UTC, décalant l'heure affichée.
    const res = await fetch("/api/raids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titles,
        date: new Date(date).toISOString(),
        signupDeadline: signupDeadline ? new Date(signupDeadline).toISOString() : null,
        notes,
        recurrenceCount: recurrent ? occurrences : undefined
      })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Erreur lors de la création.");
      return;
    }
    router.push(`/officier/raids/${Array.isArray(data.raids) ? data.raids[0].id : data.id}/composition`);
  }

  return (
    <div className="max-w-lg space-y-6">
      <p className="font-display text-lg text-bone">Configurer un nouveau raid</p>

      <form onSubmit={handleSubmit} className="war-border bg-char p-5 space-y-4">
        {error && <p className="font-ui text-xs text-blood">{error}</p>}

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-2">
            Raid(s) — plusieurs instances possibles pour un même soir, même taille uniquement
          </label>
          <div className="grid grid-cols-2 gap-2">
            {RAID_INSTANCES.map((r) => {
              const selected = titles.includes(r);
              const disabled = !selected && selectedSize !== null && RAID_INSTANCE_SIZES[r] !== selectedSize;
              return (
                <button
                  key={r}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleTitle(r)}
                  className={`font-ui text-xs px-3 py-2 text-left border transition-colors focus-ring ${
                    selected
                      ? "bg-blood border-blood text-void font-medium"
                      : disabled
                        ? "border-bone/5 text-bone/25 cursor-not-allowed"
                        : "border-bone/15 text-bone/70 hover:border-bone/40"
                  }`}
                >
                  {r}
                  <span className="block text-[10px] opacity-70">{RAID_INSTANCE_SIZES[r]} joueurs</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">Date et heure</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
          {titles.length > 1 && (
            <p className="font-ui text-xs text-bone/40 mt-1">
              Un seul événement, avec {titles.length} instances à la suite, à cette date.
            </p>
          )}
        </div>

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
            Date limite d'inscription (optionnel)
          </label>
          <input
            type="datetime-local"
            value={signupDeadline}
            onChange={(e) => {
              setDeadlineTouched(true);
              setSignupDeadline(e.target.value);
            }}
            className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
          <p className="font-ui text-xs text-bone/40 mt-1">
            Passé cette date, les inscriptions se ferment automatiquement. Par
            défaut, 3 jours avant le raid — modifiable librement.
          </p>
        </div>

        <div className="war-border bg-void/40 p-3 space-y-2">
          <label className="flex items-center gap-2 font-ui text-xs text-bone/80 cursor-pointer">
            <input
              type="checkbox"
              checked={recurrent}
              onChange={(e) => setRecurrent(e.target.checked)}
              className="focus-ring"
            />
            Récurrent — répéter ce raid chaque semaine, même jour et heure
          </label>
          {recurrent && (
            <div>
              <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
                Nombre d'occurrences
              </label>
              <input
                type="number"
                min={2}
                max={52}
                value={occurrences}
                onChange={(e) => setOccurrences(Number(e.target.value))}
                className="w-24 bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
              />
              <p className="font-ui text-xs text-bone/40 mt-1">
                Crée {occurrences} raids, un chaque semaine à partir de la date ci-dessus. La date
                limite d'inscription (si définie) suit le même décalage à chaque occurrence.
              </p>
            </div>
          )}
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
          {loading
            ? "Création..."
            : recurrent
              ? `Créer les ${occurrences} raids`
              : titles.length > 1
                ? "Créer l'événement"
                : "Créer le raid"}
        </button>
      </form>
    </div>
  );
}
