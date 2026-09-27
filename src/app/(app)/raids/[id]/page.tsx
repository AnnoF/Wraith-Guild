"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CLASS_LABELS, CLASS_COLORS, type WowClass } from "@/lib/classes";
import type { Profession } from "@/lib/professions";
import { GROUP_SIZE, GRID_COLS, groupRows } from "@/lib/raidGroups";
import ClassSpecIcon from "@/components/ClassSpecIcon";
import EnchantBadge from "@/components/EnchantBadge";
import RaidLeadBadge from "@/components/RaidLeadBadge";

interface AssignedCharacter {
  id: string;
  name: string;
  class: WowClass;
  spec: string;
  professions: { profession: Profession; isMaxed: boolean }[];
  canRaidLead: boolean;
}

interface PlacementData {
  id: string;
  slot: number;
  signupId: string;
  character: AssignedCharacter;
}

interface RunData {
  id: string;
  title: string;
  size: number;
  order: number;
  placements: PlacementData[];
}

interface PhaseData {
  id: string;
  order: number;
  runs: RunData[];
}

interface Signup {
  id: string;
  status: "INSCRIT" | "RESERVE" | "ABSENT" | "DESISTE";
  comment: string | null;
  user: { id: string; discordTag: string };
}

interface RaidDetail {
  id: string;
  name: string;
  date: string;
  endTime: string;
  status: string;
  notes: string | null;
  signupDeadline: string | null;
  phases: PhaseData[];
  signups: Signup[];
}

function findPlacement(phase: PhaseData, signupId: string): { run: RunData; placement: PlacementData } | null {
  for (const run of phase.runs) {
    const placement = run.placements.find((p) => p.signupId === signupId);
    if (placement) return { run, placement };
  }
  return null;
}

export default function RaidDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [raid, setRaid] = useState<RaidDetail | null>(null);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/raids/${id}`);
    if (res.ok) setRaid(await res.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function submitSignup(status: "INSCRIT" | "ABSENT") {
    setError(null);
    const res = await fetch(`/api/raids/${id}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: comment || undefined, status })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Impossible d'enregistrer votre statut.");
      return;
    }
    setComment("");
    load();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    await submitSignup("INSCRIT");
  }

  async function handleMarkAbsent() {
    await submitSignup("ABSENT");
  }

  async function handleWithdraw() {
    await fetch(`/api/raids/${id}/signup`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    load();
  }

  if (!raid) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  const mySignup = raid.signups.find((s) => s.user.id === session?.user.id);
  const canSignup = !mySignup || mySignup.status === "DESISTE";
  const isAbsent = mySignup?.status === "ABSENT";

  const canConfigure = session?.user.siteRole === "OFFICIER" || session?.user.siteRole === "ADMINISTRATEUR";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/raids-a-venir" className="font-ui text-xs text-bone/50 hover:text-bone">
          ← Retour aux raids à venir
        </Link>
        {canConfigure && (
          <Link
            href={`/officier/raids/${id}/composition`}
            className="font-ui text-xs text-amber hover:text-bone focus-ring underline"
          >
            Gérer la composition
          </Link>
        )}
      </div>

      <div className="gilt-frame rounded-sm bg-char p-5">
        <p className="font-display text-xl text-bone mb-1">{raid.name}</p>
        <p className="font-ui text-sm text-bone/60">
          {new Date(raid.date).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
          {" – "}
          {new Date(raid.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        {raid.signupDeadline && (
          <p className="font-ui text-xs text-bone/40 mt-1">
            Inscriptions jusqu'au{" "}
            {new Date(raid.signupDeadline).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        )}
        {raid.notes && <p className="font-ui text-sm text-bone/70 mt-3">{raid.notes}</p>}
      </div>

      {raid.status === "OUVERT" && canSignup && (
        <form onSubmit={handleSignup} className="gilt-frame rounded-sm bg-char p-5 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
              Commentaire (optionnel)
            </label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex. dispo après 21h"
              className="w-full bg-void border border-bone/15 rounded-sm focus-ring px-3 py-2 font-ui text-sm text-bone"
            />
          </div>
          <button type="submit" className="font-display text-xs bg-gold text-void font-medium rounded-full px-5 py-2.5 focus-ring">
            S'inscrire
          </button>
          <button
            type="button"
            onClick={handleMarkAbsent}
            className="font-ui text-xs text-bone/50 hover:text-bone focus-ring underline"
          >
            Me déclarer absent
          </button>
        </form>
      )}

      {raid.status === "OUVERT" && isAbsent && (
        <div className="gilt-frame rounded-sm bg-char p-5 flex items-center justify-between flex-wrap gap-3">
          <p className="font-ui text-sm text-bone/60">Vous vous êtes signalé absent pour ce raid.</p>
          <button
            onClick={() => submitSignup("INSCRIT")}
            className="font-ui text-xs text-moss hover:text-bone focus-ring underline"
          >
            Je suis finalement disponible
          </button>
        </div>
      )}

      {mySignup && !canSignup && !isAbsent && (
        <div className="gilt-frame rounded-sm bg-char p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-ui text-sm text-bone">
              Vous êtes inscrit {mySignup.status === "RESERVE" ? "(réserve)" : ""}
            </p>
            {mySignup.status === "INSCRIT" && (
              <p className="font-ui text-xs text-bone/50 mt-1">
                {raid.phases.map((p, i) => {
                  const found = findPlacement(p, mySignup.id);
                  return (
                    <span key={p.id} className="block">
                      Phase {i + 1} :{" "}
                      {found
                        ? `${found.placement.character.name} (${found.run.title})`
                        : "en attente d'assignation"}
                    </span>
                  );
                })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleMarkAbsent}
              className="font-ui text-xs text-bone/50 hover:text-bone focus-ring underline"
            >
              Me déclarer absent
            </button>
            <button
              onClick={handleWithdraw}
              className="font-ui text-xs text-bone/40 hover:text-garnet focus-ring underline"
            >
              Se désinscrire
            </button>
          </div>
        </div>
      )}
      {error && <p className="font-ui text-xs text-garnet">{error}</p>}

      <div className="space-y-6">
        {raid.phases.map((phase, phaseIndex) => (
          <div key={phase.id}>
            {raid.phases.length > 1 && (
              <p className="font-display text-sm text-bone mb-3">Phase {phaseIndex + 1}</p>
            )}
            <div className="flex flex-wrap gap-4">
              {phase.runs.map((run) => {
                const slotMap = new Map<number, PlacementData>();
                run.placements.forEach((p) => slotMap.set(p.slot, p));
                const numGroups = Math.ceil(run.size / GROUP_SIZE);
                return (
                  <div key={run.id} className="flex-1 min-w-[280px] space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xs text-bone/60">{run.title}</p>
                      <p className="font-ui text-xs text-bone/40">{run.placements.length}/{run.size}</p>
                    </div>
                    {run.placements.length === 0 ? (
                      <p className="font-ui text-sm text-bone/50">Personne de placé pour l'instant.</p>
                    ) : (
                      <div className="space-y-1">
                        {groupRows(run.size, numGroups).map((row, rowIdx) => (
                          <div key={rowIdx} className={`grid ${GRID_COLS[row.length] ?? "grid-cols-4"} gap-3`}>
                            {row.map((groupIndex) => (
                              <div key={groupIndex} className="gilt-frame rounded-sm bg-char p-3 min-w-0">
                                <p className="font-display text-xs text-bone/60 mb-2">Groupe {groupIndex + 1}</p>
                                <div className="space-y-1">
                                  {Array.from({ length: GROUP_SIZE }, (_, i) => {
                                    const slot = groupIndex * GROUP_SIZE + i;
                                    const occupant = slotMap.get(slot);
                                    const classColor = occupant ? CLASS_COLORS[occupant.character.class] : null;
                                    return (
                                      <div
                                        key={slot}
                                        style={classColor ? { backgroundColor: `${classColor}66`, borderColor: `${classColor}80` } : undefined}
                                        className={`min-h-[28px] px-2 py-1 border font-ui text-xs flex items-center gap-1.5 ${
                                          occupant ? "text-bone" : "border-dashed border-bone/10"
                                        }`}
                                      >
                                        {occupant && (
                                          <>
                                            <ClassSpecIcon wowClass={occupant.character.class} spec={occupant.character.spec} />
                                            <span className="truncate">{occupant.character.name}</span>
                                            {occupant.character.canRaidLead && <RaidLeadBadge />}
                                            <EnchantBadge character={occupant.character} />
                                          </>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
