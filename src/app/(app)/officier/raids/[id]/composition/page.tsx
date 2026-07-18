"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CLASS_LABELS, guessRaidRole, type WowClass } from "@/lib/classes";
import type { Profession } from "@/lib/professions";
import CharacterBadges from "@/components/CharacterBadges";

interface CharacterOption {
  id: string;
  name: string;
  class: WowClass;
  spec: string;
  professions: { profession: Profession; isMaxed: boolean }[];
}

interface Signup {
  id: string;
  status: "INSCRIT" | "RESERVE" | "ABSENT" | "DESISTE";
  comment: string | null;
  characterId: string | null;
  user: { id: string; discordTag: string; characters: CharacterOption[] };
  character: CharacterOption | null;
}

interface RaidDetail {
  id: string;
  title: string;
  size: number;
  status: string;
  signups: Signup[];
}

// Constructeur de composition : le joueur s'est inscrit sans choisir de
// personnage, l'Officier assigne ici lequel de ses personnages actifs
// représente ce joueur dans le raid, puis bascule chaque inscrit entre
// Inscrit / Réserve, et peut clôturer ou terminer le raid.
export default function CompositionPage() {
  const { id } = useParams<{ id: string }>();
  const [raid, setRaid] = useState<RaidDetail | null>(null);

  async function load() {
    const res = await fetch(`/api/raids/${id}`);
    if (res.ok) setRaid(await res.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateSignup(userId: string, data: { status?: Signup["status"]; characterId?: string | null }) {
    await fetch(`/api/raids/${id}/signup`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data })
    });
    load();
  }

  async function removeSignup(userId: string) {
    await fetch(`/api/raids/${id}/signup`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    load();
  }

  async function setRaidStatus(status: string) {
    await fetch(`/api/raids/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    load();
  }

  if (!raid) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  const relevant = raid.signups.filter((s) => s.status === "INSCRIT" || s.status === "RESERVE");
  const assigned = relevant.filter((s) => s.status === "INSCRIT" && s.character);
  const roleGroups = { TANK: 0, SOIGNEUR: 0, DPS: 0 };
  assigned.forEach((s) => {
    const role = guessRaidRole(s.character!.class, s.character!.spec);
    roleGroups[role]++;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="font-display text-lg text-bone">Composition — {raid.title}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setRaidStatus("OUVERT")}
            className="font-ui text-xs px-3 py-1.5 border border-moss text-moss focus-ring"
          >
            Ouvrir
          </button>
          <button
            onClick={() => setRaidStatus("FERME")}
            className="font-ui text-xs px-3 py-1.5 border border-amber text-amber focus-ring"
          >
            Fermer les inscriptions
          </button>
          <button
            onClick={() => setRaidStatus("TERMINE")}
            className="font-ui text-xs px-3 py-1.5 border border-bone/30 text-bone/60 focus-ring"
          >
            Marquer comme terminé
          </button>
        </div>
      </div>

      <div className="flex gap-4 font-ui text-xs text-bone/60">
        <span>Tanks : {roleGroups.TANK}</span>
        <span>Soigneurs : {roleGroups.SOIGNEUR}</span>
        <span>DPS : {roleGroups.DPS}</span>
        <span>Total inscrits : {relevant.filter((s) => s.status === "INSCRIT").length} / {raid.size}</span>
        <span>Sans personnage assigné : {relevant.filter((s) => s.status === "INSCRIT" && !s.character).length}</span>
      </div>

      <div className="space-y-2">
        {relevant.length === 0 && <p className="font-ui text-sm text-bone/50">Aucun inscrit pour l'instant.</p>}
        {relevant.map((s) => (
          <div key={s.id} className="war-border bg-char px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-ui text-sm text-bone">{s.user.discordTag}</span>
                {s.status === "RESERVE" && (
                  <span className="font-ui text-[10px] uppercase text-amber">Réserve</span>
                )}
                {s.character && <CharacterBadges character={s.character} />}
              </div>
              {s.comment && <p className="font-ui text-xs text-bone/40 mt-0.5">{s.comment}</p>}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={s.characterId ?? ""}
                onChange={(e) => updateSignup(s.user.id, { characterId: e.target.value || null })}
                className="bg-void border border-bone/15 focus-ring px-2 py-1.5 font-ui text-xs text-bone"
              >
                <option value="" className="bg-void text-bone">
                  — Non assigné —
                </option>
                {s.user.characters.map((c) => (
                  <option key={c.id} value={c.id} className="bg-void text-bone">
                    {c.name} ({CLASS_LABELS[c.class]} · {c.spec})
                  </option>
                ))}
              </select>
              <button
                onClick={() => updateSignup(s.user.id, { status: s.status === "INSCRIT" ? "RESERVE" : "INSCRIT" })}
                className="font-ui text-xs px-2.5 py-1 border border-bone/20 text-bone/70 hover:text-bone focus-ring"
              >
                {s.status === "INSCRIT" ? "Passer en réserve" : "Passer en inscrit"}
              </button>
              <button
                onClick={() => removeSignup(s.user.id)}
                className="font-ui text-xs px-2.5 py-1 border border-blood/40 text-blood/80 hover:text-blood focus-ring"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
