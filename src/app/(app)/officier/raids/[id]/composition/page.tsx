"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CLASS_LABELS, guessRaidRole, type WowClass } from "@/lib/classes";
import type { Profession } from "@/lib/professions";
import CharacterBadges from "@/components/CharacterBadges";

const GROUP_SIZE = 5; // 4 groupes par ligne au-delà de lg, voir grid-cols-4 plus bas

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
  slot: number | null;
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

interface DragPayload {
  userId: string;
  characterId: string;
}

// Constructeur de composition : le joueur s'est inscrit sans choisir de
// personnage. À gauche, la liste des inscrits avec leurs personnages
// (glissables) ; à droite, la grille de groupes de 5 où l'Officier
// dépose le personnage retenu pour chaque joueur.
export default function CompositionPage() {
  const { id } = useParams<{ id: string }>();
  const [raid, setRaid] = useState<RaidDetail | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  async function load() {
    const res = await fetch(`/api/raids/${id}`);
    if (res.ok) setRaid(await res.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateSignup(userId: string, data: { characterId?: string | null; slot?: number | null }) {
    await fetch(`/api/raids/${id}/signup`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data })
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

  function handleDragStart(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: React.DragEvent, slot: number) {
    e.preventDefault();
    setDragOverSlot(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload: DragPayload = JSON.parse(raw);
    updateSignup(payload.userId, { characterId: payload.characterId, slot });
  }

  if (!raid) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  const players = raid.signups.filter((s) => s.status === "INSCRIT");
  const placed = players.filter((s) => s.slot !== null && s.character);
  const roleGroups = { TANK: 0, SOIGNEUR: 0, DPS: 0 };
  placed.forEach((s) => {
    const role = guessRaidRole(s.character!.class, s.character!.spec);
    roleGroups[role]++;
  });

  const slotMap = new Map<number, Signup>();
  placed.forEach((s) => slotMap.set(s.slot!, s));

  const numGroups = Math.ceil(raid.size / GROUP_SIZE);

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
        <span>Inscrits : {players.length}</span>
        <span>Placés : {placed.length} / {raid.size}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 space-y-2">
          {players.length === 0 && <p className="font-ui text-sm text-bone/50">Aucun inscrit pour l'instant.</p>}
          {players.map((s) => {
            const isPlaced = s.slot !== null;
            return (
              <div key={s.id} className="war-border bg-char px-4 py-2.5">
                <p className={`font-ui text-sm ${isPlaced ? "text-bone/30" : "text-bone"}`}>{s.user.discordTag}</p>
                {s.comment && <p className="font-ui text-xs text-bone/30 mt-0.5">{s.comment}</p>}
                <div className="mt-1.5 space-y-1">
                  {s.user.characters.length === 0 && (
                    <p className="font-ui text-xs text-bone/30 ml-3">Aucun personnage actif</p>
                  )}
                  {s.user.characters.map((c) => {
                    const isSelected = s.characterId === c.id;
                    const dimmed = isPlaced && !isSelected;
                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: c.id })}
                        className={`ml-3 flex items-center gap-1.5 font-ui text-xs px-2 py-1 border cursor-grab active:cursor-grabbing ${
                          dimmed
                            ? "border-bone/5 text-bone/25"
                            : isSelected
                            ? "border-amber/50 text-bone"
                            : "border-bone/10 text-bone/70 hover:border-bone/30"
                        }`}
                      >
                        <CharacterBadges character={c} />
                        <span>
                          {c.name} ({CLASS_LABELS[c.class]} · {c.spec})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:w-2/3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: numGroups }, (_, groupIndex) => (
              <div key={groupIndex} className="war-border bg-char p-3">
                <p className="font-display text-xs text-bone/60 mb-2">Groupe {groupIndex + 1}</p>
                <div className="space-y-1">
                  {Array.from({ length: GROUP_SIZE }, (_, i) => {
                    const slot = groupIndex * GROUP_SIZE + i;
                    const occupant = slotMap.get(slot);
                    return (
                      <div
                        key={slot}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverSlot(slot);
                        }}
                        onDragLeave={() => setDragOverSlot((cur) => (cur === slot ? null : cur))}
                        onDrop={(e) => handleDrop(e, slot)}
                        className={`min-h-[28px] px-2 py-1 border font-ui text-xs flex items-center justify-between gap-1 ${
                          dragOverSlot === slot
                            ? "border-blood bg-blood/10"
                            : occupant
                            ? "border-bone/15 bg-void"
                            : "border-dashed border-bone/10 text-bone/20"
                        }`}
                      >
                        {occupant && occupant.character ? (
                          <>
                            <span
                              draggable
                              onDragStart={(e) =>
                                handleDragStart(e, {
                                  userId: occupant.user.id,
                                  characterId: occupant.character!.id
                                })
                              }
                              className="flex items-center gap-1.5 text-bone cursor-grab active:cursor-grabbing truncate"
                            >
                              <CharacterBadges character={occupant.character} />
                              {occupant.character.name}
                            </span>
                            <button
                              onClick={() => updateSignup(occupant.user.id, { slot: null })}
                              className="text-bone/30 hover:text-blood focus-ring shrink-0"
                              title="Retirer du groupe"
                            >
                              ×
                            </button>
                          </>
                        ) : (
                          <span>— vide —</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
