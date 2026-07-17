"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CLASS_LABELS, guessRaidRole } from "@/lib/classes";

interface Signup {
  id: string;
  status: "INSCRIT" | "RESERVE" | "ABSENT" | "DESISTE";
  character: { id: string; name: string; class: keyof typeof CLASS_LABELS; spec: string };
}

interface RaidDetail {
  id: string;
  title: string;
  size: number;
  status: string;
  signups: Signup[];
}

// Constructeur de composition : l'Officier bascule chaque inscrit entre
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

  async function setSignupStatus(characterId: string, status: Signup["status"]) {
    await fetch(`/api/raids/${id}/signup`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, status })
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
  const roleGroups = { TANK: 0, SOIGNEUR: 0, DPS: 0 };
  relevant
    .filter((s) => s.status === "INSCRIT")
    .forEach((s) => {
      const role = guessRaidRole(s.character.class, s.character.spec);
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
      </div>

      <div className="space-y-2">
        {relevant.length === 0 && <p className="font-ui text-sm text-bone/50">Aucun inscrit pour l'instant.</p>}
        {relevant.map((s) => (
          <div key={s.id} className="war-border bg-char px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="font-ui text-sm text-bone">{s.character.name}</span>
              <span className="font-ui text-xs text-bone/50 ml-2">
                {CLASS_LABELS[s.character.class]} · {s.character.spec} ·{" "}
                {guessRaidRole(s.character.class, s.character.spec)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSignupStatus(s.character.id, s.status === "INSCRIT" ? "RESERVE" : "INSCRIT")}
                className="font-ui text-xs px-2.5 py-1 border border-bone/20 text-bone/70 hover:text-bone focus-ring"
              >
                {s.status === "INSCRIT" ? "Passer en réserve" : "Passer en inscrit"}
              </button>
              <button
                onClick={() => setSignupStatus(s.character.id, "ABSENT")}
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
