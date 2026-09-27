"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RAID_INSTANCES,
  RAID_INSTANCE_SIZES,
  instancesShareSize,
  decodeProgram,
  type RaidInstance
} from "@/lib/raidInstances";

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

interface DragPayload {
  title: RaidInstance;
  fromPhase: number | null; // null = vient de la réserve
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
  const prefillProgram = searchParams.get("program");
  const [name, setName] = useState(searchParams.get("name") ?? "");
  const [phases, setPhases] = useState<string[][]>(
    prefillProgram ? decodeProgram(prefillProgram) : []
  );
  const [date, setDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [signupDeadline, setSignupDeadline] = useState("");
  const [deadlineTouched, setDeadlineTouched] = useState(false);
  const [notes, setNotes] = useState(searchParams.get("notes") ?? "");
  const [recurrent, setRecurrent] = useState(false);
  const [occurrences, setOccurrences] = useState(4);
  const [error, setError] = useState<string | null>(null);
  const [dragOverPhase, setDragOverPhase] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  function addPhase(title: string) {
    setError(null);
    setPhases((current) => [...current, [title]]);
  }

  function removeInstance(phaseIndex: number, instanceIndex: number) {
    setPhases((current) => {
      const next = current.map((phase, i) => (i === phaseIndex ? phase.filter((_, j) => j !== instanceIndex) : phase));
      return next.filter((phase) => phase.length > 0);
    });
  }

  function movePhase(phaseIndex: number, direction: -1 | 1) {
    setPhases((current) => {
      const target = phaseIndex + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[phaseIndex], next[target]] = [next[target], next[phaseIndex]];
      return next;
    });
  }

  function handleDragStart(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDropOnPhase(e: React.DragEvent, phaseIndex: number) {
    e.preventDefault();
    setDragOverPhase(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload: DragPayload = JSON.parse(raw);

    setPhases((current) => {
      const targetPhase = current[phaseIndex];
      if (!instancesShareSize([...targetPhase, payload.title])) {
        setError("Cette instance n'a pas la même taille que le reste de cette phase.");
        return current;
      }
      setError(null);
      let next = current.map((phase, i) => (i === phaseIndex ? [...phase, payload.title] : phase));
      if (payload.fromPhase !== null) {
        // Retire une occurrence de l'instance dans sa phase d'origine (sauf
        // si on la dépose sur sa propre phase : elle vient d'y être
        // rajoutée juste au-dessus, donc rien à faire de plus).
        const originIndex = payload.fromPhase;
        next = next.map((phase, i) => {
          if (i !== originIndex) return phase;
          const copy = [...phase];
          const idx = copy.indexOf(payload.title);
          if (idx !== -1 && (originIndex !== phaseIndex || copy.length > targetPhase.length)) {
            copy.splice(idx, 1);
          }
          return copy;
        });
        next = next.filter((phase) => phase.length > 0);
      }
      return next;
    });
  }

  const selectedSizes = phases.map((phase) => RAID_INSTANCE_SIZES[phase[0]]);

  // Par défaut, la date limite d'inscription se cale 3 jours avant le
  // début de la soirée — tant que l'officier n'a pas lui-même modifié ce champ.
  function handleDateChange(value: string) {
    setDate(value);
    if (!deadlineTouched) {
      setSignupDeadline(value ? subtractDaysLocal(value, 3) : "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Le nom de l'évent est obligatoire.");
      return;
    }
    if (phases.length === 0) {
      setError("Programmez au moins une phase.");
      return;
    }
    if (!date || !endTime) {
      setError("La date de début et l'heure de fin sont obligatoires.");
      return;
    }
    if (new Date(endTime) <= new Date(date)) {
      setError("L'heure de fin doit être après l'heure de début.");
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
        name: name.trim(),
        date: new Date(date).toISOString(),
        endTime: new Date(endTime).toISOString(),
        signupDeadline: signupDeadline ? new Date(signupDeadline).toISOString() : null,
        notes,
        recurrenceCount: recurrent ? occurrences : undefined,
        phases: phases.map((titles) => ({ titles }))
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

      <form onSubmit={handleSubmit} className="gilt-frame rounded-sm bg-char p-5 space-y-4">
        {error && <p className="font-ui text-xs text-garnet">{error}</p>}

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
            Nom de l'évent
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex. Soirée raid du mercredi"
            className="w-full bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
              Début
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
            />
          </div>
          <div>
            <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
              Fin
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
            />
          </div>
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
            className="w-full bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
          <p className="font-ui text-xs text-bone/40 mt-1">
            Passé cette date, les inscriptions se ferment automatiquement. Par
            défaut, 3 jours avant le début — modifiable librement.
          </p>
        </div>

        <div>
          <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-2">
            Programme de la soirée
          </label>
          <div className="grid grid-cols-2 gap-2">
            {RAID_INSTANCES.map((r) => (
              <button
                key={r}
                type="button"
                draggable
                onDragStart={(e) => handleDragStart(e, { title: r, fromPhase: null })}
                onClick={() => addPhase(r)}
                className="font-ui text-xs px-3 py-2 text-left border rounded-sm transition-colors focus-ring border-bone/15 text-bone/70 hover:border-gold hover:text-bone cursor-grab active:cursor-grabbing"
              >
                {r}
                <span className="block text-[10px] opacity-70">{RAID_INSTANCE_SIZES[r]} joueurs</span>
              </button>
            ))}
          </div>
          <p className="font-ui text-[11px] text-bone/40 mt-1.5">
            Clic : ajoute une nouvelle phase. Glisser sur une phase existante :
            programme une instance concurrente (même taille uniquement).
          </p>

          {phases.length > 0 && (
            <div className="mt-3 space-y-2">
              {phases.map((phase, phaseIndex) => (
                <div
                  key={phaseIndex}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverPhase(phaseIndex);
                  }}
                  onDragLeave={() => setDragOverPhase((cur) => (cur === phaseIndex ? null : cur))}
                  onDrop={(e) => handleDropOnPhase(e, phaseIndex)}
                  className={`gilt-frame rounded-sm bg-void/40 p-2.5 flex items-center gap-2 ${
                    dragOverPhase === phaseIndex ? "border-gold" : ""
                  }`}
                >
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={phaseIndex === 0}
                      onClick={() => movePhase(phaseIndex, -1)}
                      className="font-ui text-[10px] text-bone/40 hover:text-bone disabled:opacity-20 focus-ring"
                      title="Monter"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={phaseIndex === phases.length - 1}
                      onClick={() => movePhase(phaseIndex, 1)}
                      className="font-ui text-[10px] text-bone/40 hover:text-bone disabled:opacity-20 focus-ring"
                      title="Descendre"
                    >
                      ▼
                    </button>
                  </div>
                  <p className="font-ui text-[10px] uppercase tracking-wide text-bone/40 shrink-0">
                    Phase {phaseIndex + 1}
                  </p>
                  <div className="flex flex-wrap gap-1.5 flex-1">
                    {phase.map((title, instanceIndex) => (
                      <span
                        key={`${title}-${instanceIndex}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { title: title as RaidInstance, fromPhase: phaseIndex })}
                        className="flex items-center gap-1.5 font-ui text-xs px-2 py-1 border border-gold/60 bg-gold/10 text-bone cursor-grab active:cursor-grabbing"
                      >
                        {title}
                        <button
                          type="button"
                          onClick={() => removeInstance(phaseIndex, instanceIndex)}
                          className="text-bone/40 hover:text-garnet focus-ring"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <span className="font-ui text-[10px] text-bone/40 shrink-0">{selectedSizes[phaseIndex]} joueurs</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="gilt-frame rounded-sm bg-void/40 p-3 space-y-2">
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
                className="w-24 bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
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
            className="w-full bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="font-display text-sm bg-gold text-void font-medium rounded-full px-5 py-2.5 disabled:opacity-50 focus-ring"
        >
          {loading
            ? "Création..."
            : recurrent
              ? `Créer les ${occurrences} raids`
              : "Créer le raid"}
        </button>
      </form>
    </div>
  );
}
