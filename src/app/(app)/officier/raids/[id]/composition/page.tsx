"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CLASS_COLORS, guessRaidRole, type WowClass } from "@/lib/classes";
import type { Profession } from "@/lib/professions";
import CharacterBadges from "@/components/CharacterBadges";

const GROUP_SIZE = 5;

// Classes Tailwind statiques (nécessaire : Tailwind ne génère que les
// classes qu'il trouve littéralement dans le code source).
const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4"
};

// Regroupe les groupes de 5 par ligne : 4 par ligne par défaut, sauf pour
// un raid de 25 (5 groupes) qu'on affiche en 2 puis 3.
function groupRows(size: number, numGroups: number): number[][] {
  if (size === 25) return [[0, 1], [2, 3, 4]];
  const rows: number[][] = [];
  for (let i = 0; i < numGroups; i += 4) {
    rows.push(Array.from({ length: Math.min(4, numGroups - i) }, (_, j) => i + j));
  }
  return rows;
}

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
  const unplaced = players.filter((s) => s.slot === null);
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
        <div className="lg:w-1/4 space-y-2">
          <p className="font-display text-xs text-bone/50">À placer</p>
          {players.length === 0 && <p className="font-ui text-sm text-bone/50">Aucun inscrit pour l'instant.</p>}
          {players.length > 0 && unplaced.length === 0 && (
            <p className="font-ui text-sm text-bone/50">Tous les inscrits sont placés.</p>
          )}
          {unplaced.map((s) => (
            <div key={s.id} className="war-border bg-char px-4 py-2.5">
              <p className="font-ui text-sm text-bone">{s.user.discordTag}</p>
              {s.comment && <p className="font-ui text-xs text-bone/30 mt-0.5">{s.comment}</p>}
              <div className="mt-1.5 space-y-1">
                {s.user.characters.length === 0 && (
                  <p className="font-ui text-xs text-bone/30 ml-3">Aucun personnage actif</p>
                )}
                {s.user.characters.map((c) => {
                  const isSelected = s.characterId === c.id;
                  const color = CLASS_COLORS[c.class];
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: c.id })}
                      style={{
                        backgroundColor: `${color}66`,
                        borderColor: isSelected ? "var(--amber)" : `${color}B3`
                      }}
                      className="ml-3 flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone cursor-grab active:cursor-grabbing"
                    >
                      <CharacterBadges character={c} />
                      <span>{c.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:w-1/2 space-y-3">
          {groupRows(raid.size, numGroups).map((row, rowIdx) => (
            <div key={rowIdx} className={`grid ${GRID_COLS[row.length] ?? "grid-cols-4"} gap-3`}>
              {row.map((groupIndex) => (
                <div key={groupIndex} className="war-border bg-char p-3 min-w-0">
                  <p className="font-display text-xs text-bone/60 mb-2">Groupe {groupIndex + 1}</p>
                  <div className="space-y-1">
                    {Array.from({ length: GROUP_SIZE }, (_, i) => {
                      const slot = groupIndex * GROUP_SIZE + i;
                      const occupant = slotMap.get(slot);
                      const classColor = occupant?.character ? CLASS_COLORS[occupant.character.class] : null;
                      return (
                        <div
                          key={slot}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDragOverSlot(slot);
                          }}
                          onDragLeave={() => setDragOverSlot((cur) => (cur === slot ? null : cur))}
                          onDrop={(e) => handleDrop(e, slot)}
                          style={
                            classColor && dragOverSlot !== slot
                              ? { backgroundColor: `${classColor}66`, borderColor: `${classColor}80` }
                              : undefined
                          }
                          className={`min-h-[28px] px-2 py-1 border font-ui text-xs flex items-center justify-between gap-1 ${
                            dragOverSlot === slot
                              ? "border-blood bg-blood/10"
                              : occupant
                              ? ""
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
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="lg:w-1/4 space-y-2">
          <p className="font-display text-xs text-bone/50">Placés</p>
          {placed.length === 0 && <p className="font-ui text-sm text-bone/50">Personne de placé pour l'instant.</p>}
          {placed.map((s) => {
            const color = CLASS_COLORS[s.character!.class];
            return (
              <div key={s.id} className="war-border bg-char px-4 py-2.5">
                <p className="font-ui text-sm text-bone">{s.user.discordTag}</p>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: s.character!.id })}
                  style={{ backgroundColor: `${color}66`, borderColor: `${color}B3` }}
                  className="mt-1.5 flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone cursor-grab active:cursor-grabbing"
                >
                  <CharacterBadges character={s.character!} />
                  <span>{s.character!.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
