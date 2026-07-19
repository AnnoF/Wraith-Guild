"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CLASS_COLORS, guessRaidRole, type WowClass, type RaidRole } from "@/lib/classes";
import type { Profession } from "@/lib/professions";
import { GROUP_SIZE, GRID_COLS, groupRows } from "@/lib/raidGroups";
import { RAID_BOSS_ROLES, type BossRoles } from "@/lib/bossRoles";
import ClassSpecIcon from "@/components/ClassSpecIcon";
import EnchantBadge from "@/components/EnchantBadge";
import RaidLeadBadge from "@/components/RaidLeadBadge";
import WeekLockBadge from "@/components/WeekLockBadge";

const ROLE_FILTERS: { value: RaidRole | "ALL"; label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "TANK", label: "Tank" },
  { value: "SOIGNEUR", label: "Soigneur" },
  { value: "DPS", label: "DPS" }
];

interface CharacterOption {
  id: string;
  name: string;
  class: WowClass;
  spec: string;
  professions: { profession: Profession; isMaxed: boolean }[];
  canRaidLead: boolean;
  weekLocked?: boolean;
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

interface BossRoleAssignmentData {
  id: string;
  boss: string;
  role: string;
  characterId: string | null;
  character: CharacterOption | null;
}

interface RaidDetail {
  id: string;
  title: string;
  size: number;
  status: string;
  notes: string | null;
  signups: Signup[];
  bossRoleAssignments: BossRoleAssignmentData[];
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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RaidRole | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [dragOverBossRole, setDragOverBossRole] = useState<string | null>(null);
  const [collapsedBosses, setCollapsedBosses] = useState<Set<string>>(new Set());

  function toggleBossCollapsed(boss: string) {
    setCollapsedBosses((prev) => {
      const next = new Set(prev);
      if (next.has(boss)) next.delete(boss);
      else next.add(boss);
      return next;
    });
  }

  function expandBosses(bosses: string[]) {
    setCollapsedBosses((prev) => {
      const next = new Set(prev);
      bosses.forEach((b) => next.delete(b));
      return next;
    });
  }

  // Regroupe les boss réduits consécutifs en une seule bande compacte, pour
  // éviter d'avoir à faire défiler beaucoup de lignes "Réduire" avant
  // d'atteindre le boss sur lequel on veut glisser un personnage.
  function groupCollapsedRuns(template: BossRoles[], collapsed: Set<string>): BossRoles[][] {
    const groups: BossRoles[][] = [];
    let run: BossRoles[] = [];
    for (const entry of template) {
      if (collapsed.has(entry.boss)) {
        run.push(entry);
      } else {
        if (run.length) {
          groups.push(run);
          run = [];
        }
        groups.push([entry]);
      }
    }
    if (run.length) groups.push(run);
    return groups;
  }

  async function load() {
    const res = await fetch(`/api/raids/${id}`);
    if (res.ok) setRaid(await res.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function updateSignup(userId: string, data: { characterId?: string | null; slot?: number | null }) {
    const res = await fetch(`/api/raids/${id}/signup`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, ...data })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Impossible d'assigner ce personnage.");
    } else {
      setError(null);
    }
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

  async function assignBossRole(boss: string, role: string, characterId: string | null) {
    const res = await fetch(`/api/raids/${id}/boss-roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ boss, role, characterId })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Impossible d'assigner ce rôle.");
    } else {
      setError(null);
    }
    load();
  }

  function handleBossDrop(e: React.DragEvent, boss: string, role: string) {
    e.preventDefault();
    setDragOverBossRole(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload: DragPayload = JSON.parse(raw);
    assignBossRole(boss, role, payload.characterId);
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

  function handleQuickAssign(userId: string, characterId: string) {
    for (let slot = 0; slot < raid!.size; slot++) {
      if (!slotMap.has(slot)) {
        updateSignup(userId, { characterId, slot });
        return;
      }
    }
  }

  function matchesFilters(s: Signup) {
    const chars = s.user.characters;
    if (roleFilter !== "ALL" && !chars.some((c) => guessRaidRole(c.class, c.spec) === roleFilter)) {
      return false;
    }
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.user.discordTag.toLowerCase().includes(q) || chars.some((c) => c.name.toLowerCase().includes(q));
  }

  const filteredUnplaced = unplaced.filter(matchesFilters);
  const filteredPlaced = placed.filter(matchesFilters);

  const bossTemplate = RAID_BOSS_ROLES[raid.title] ?? [];
  const bossAssignmentMap = new Map<string, BossRoleAssignmentData>();
  raid.bossRoleAssignments.forEach((a) => bossAssignmentMap.set(`${a.boss}|${a.role}`, a));
  const characterOwnerMap = new Map<string, string>();
  placed.forEach((s) => {
    if (s.character) characterOwnerMap.set(s.character.id, s.user.id);
  });

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 px-6">
    <div className="max-w-[1600px] mx-auto space-y-6">
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
          <button
            onClick={() => {
              if (confirm("Annuler ce raid ? Les inscriptions seront fermées.")) setRaidStatus("ANNULE");
            }}
            className="font-ui text-xs px-3 py-1.5 border border-blood text-blood focus-ring"
          >
            Annuler le raid
          </button>
          <Link
            href={`/officier/raids/nouveau?title=${encodeURIComponent(raid.title)}&notes=${encodeURIComponent(raid.notes ?? "")}`}
            className="font-ui text-xs px-3 py-1.5 border border-bone/30 text-bone/60 hover:text-bone focus-ring"
          >
            Dupliquer ce raid
          </Link>
        </div>
      </div>

      <div className="flex gap-4 font-ui text-xs text-bone/60">
        <span>Tanks : {roleGroups.TANK}</span>
        <span>Soigneurs : {roleGroups.SOIGNEUR}</span>
        <span>DPS : {roleGroups.DPS}</span>
        <span>Inscrits : {players.length}</span>
        <span>Placés : {placed.length} / {raid.size}</span>
      </div>

      {error && (
        <p className="font-ui text-xs text-blood war-border bg-char px-4 py-2.5">{error}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un joueur ou un personnage..."
          className="bg-void border border-bone/15 focus-ring px-3 py-1.5 font-ui text-xs text-bone w-64"
        />
        <div className="flex gap-1">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.value}
              onClick={() => setRoleFilter(r.value)}
              className={`font-ui text-xs px-2.5 py-1.5 border focus-ring ${
                roleFilter === r.value
                  ? "bg-blood text-void border-blood"
                  : "border-bone/20 text-bone/60 hover:text-bone"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <p className="font-display text-xs text-bone/50 mb-2">À placer</p>
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
            {players.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Aucun inscrit pour l'instant.</p>
            )}
            {players.length > 0 && unplaced.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Tous les inscrits sont placés.</p>
            )}
            {unplaced.length > 0 && filteredUnplaced.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Aucun résultat pour ces filtres.</p>
            )}
            {filteredUnplaced.map((s) => (
              <div key={s.id} className="war-border bg-char px-3 py-2.5">
                <p className="font-ui text-sm text-bone">{s.user.discordTag}</p>
                {s.comment && <p className="font-ui text-xs text-bone/30 mt-0.5">{s.comment}</p>}
                <div className="mt-1.5 space-y-1">
                  {s.user.characters.length === 0 && (
                    <p className="font-ui text-xs text-bone/30">Aucun personnage actif</p>
                  )}
                  {s.user.characters.map((c) => {
                    const isSelected = s.characterId === c.id;
                    const color = CLASS_COLORS[c.class];
                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: c.id })}
                        onDoubleClick={() => handleQuickAssign(s.user.id, c.id)}
                        title="Double-clic pour placer automatiquement"
                        style={{
                          backgroundColor: `${color}66`,
                          borderColor: isSelected ? "var(--amber)" : `${color}B3`
                        }}
                        className="flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone cursor-grab active:cursor-grabbing"
                      >
                        <ClassSpecIcon wowClass={c.class} spec={c.spec} />
                        <span>{c.name}</span>
                        {c.canRaidLead && <RaidLeadBadge />}
                        <EnchantBadge character={c} />
                        {c.weekLocked && <WeekLockBadge />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
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
                                <ClassSpecIcon wowClass={occupant.character.class} spec={occupant.character.spec} />
                                <span className="truncate">{occupant.character.name}</span>
                                {occupant.character.canRaidLead && <RaidLeadBadge />}
                                <EnchantBadge character={occupant.character} />
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

        <div className="lg:w-1/4">
          <p className="font-display text-xs text-bone/50 mb-2">Placés</p>
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
            {placed.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Personne de placé pour l'instant.</p>
            )}
            {placed.length > 0 && filteredPlaced.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Aucun résultat pour ces filtres.</p>
            )}
            {filteredPlaced.map((s) => {
              const otherCharacters = s.user.characters.filter((c) => c.id !== s.characterId);
              return (
                <div key={s.id} className="war-border bg-char px-3 py-2.5">
                  <p className="font-ui text-sm text-bone">{s.user.discordTag}</p>
                  <div className="mt-1.5 space-y-1">
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: s.character!.id })}
                      style={{
                        backgroundColor: `${CLASS_COLORS[s.character!.class]}66`,
                        borderColor: "var(--amber)"
                      }}
                      className="flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone cursor-grab active:cursor-grabbing"
                    >
                      <ClassSpecIcon wowClass={s.character!.class} spec={s.character!.spec} />
                      <span>{s.character!.name}</span>
                      {s.character!.canRaidLead && <RaidLeadBadge />}
                      <EnchantBadge character={s.character!} />
                    </div>
                    {otherCharacters.map((c) => {
                      const color = CLASS_COLORS[c.class];
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: c.id })}
                          onDoubleClick={() => handleQuickAssign(s.user.id, c.id)}
                          title="Double-clic pour placer automatiquement"
                          style={{ backgroundColor: `${color}33`, borderColor: `${color}66` }}
                          className="flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone/70 cursor-grab active:cursor-grabbing"
                        >
                          <ClassSpecIcon wowClass={c.class} spec={c.spec} />
                          <span>{c.name}</span>
                          {c.canRaidLead && <RaidLeadBadge />}
                          <EnchantBadge character={c} />
                          {c.weekLocked && <WeekLockBadge />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setAdvancedMode((v) => !v)}
          className="font-ui text-xs px-4 py-2 border border-bone/30 text-bone/60 hover:text-bone focus-ring"
        >
          {advancedMode ? "Masquer le mode avancé" : "Mode avancé — rôles par boss"}
        </button>
      </div>

      {advancedMode && (
        <div className="lg:w-1/2 mx-auto space-y-3">
          {bossTemplate.length === 0 ? (
            <p className="font-ui text-sm text-bone/50 text-center">
              Pas encore de rôles définis pour {raid.title}.
            </p>
          ) : (
            groupCollapsedRuns(bossTemplate, collapsedBosses).map((group, groupIdx) => {
              if (group.length > 1) {
                const names = group.map((b) => b.boss);
                return (
                  <button
                    key={`group-${groupIdx}`}
                    onClick={() => expandBosses(names)}
                    className="w-full war-border bg-char px-4 py-2.5 flex items-center justify-between gap-3 text-left focus-ring"
                  >
                    <span className="font-ui text-xs text-bone/50 truncate">{names.join(", ")}</span>
                    <span className="font-ui text-[10px] uppercase tracking-wide text-bone/40 shrink-0">
                      {names.length} boss — Afficher ▸
                    </span>
                  </button>
                );
              }

              const { boss, roles } = group[0];
              const isCollapsed = collapsedBosses.has(boss);
              return (
                <div key={boss} className="war-border bg-char p-4">
                  <button
                    onClick={() => toggleBossCollapsed(boss)}
                    className="flex items-center justify-between w-full font-display text-sm text-bone focus-ring"
                  >
                    <span>{boss}</span>
                    <span className="font-ui text-[10px] uppercase tracking-wide text-bone/40">
                      {isCollapsed ? "Afficher ▸" : "Réduire ▾"}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {roles.map((role) => {
                        const key = `${boss}|${role.label}`;
                        const assignedChar = bossAssignmentMap.get(key)?.character ?? null;
                        const classColor = assignedChar ? CLASS_COLORS[assignedChar.class] : null;
                        return (
                          <div
                            key={role.label}
                            style={{
                              gridColumn: role.col,
                              gridRow: role.row,
                              ...(classColor && dragOverBossRole !== key
                                ? { backgroundColor: `${classColor}66`, borderColor: `${classColor}80` }
                                : undefined)
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOverBossRole(key);
                            }}
                            onDragLeave={() => setDragOverBossRole((cur) => (cur === key ? null : cur))}
                            onDrop={(e) => handleBossDrop(e, boss, role.label)}
                            className={`min-h-[44px] px-2 py-1.5 border font-ui text-xs flex flex-col justify-center gap-0.5 ${
                              dragOverBossRole === key
                                ? "border-blood bg-blood/10"
                                : assignedChar
                                ? ""
                                : "border-dashed border-bone/10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={assignedChar ? "text-bone/50" : "text-bone/30"}>{role.label}</span>
                              {assignedChar && (
                                <button
                                  onClick={() => assignBossRole(boss, role.label, null)}
                                  className="text-bone/30 hover:text-blood focus-ring shrink-0"
                                  title="Retirer"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            {assignedChar && (
                              <span
                                draggable
                                onDragStart={(e) =>
                                  handleDragStart(e, {
                                    userId: characterOwnerMap.get(assignedChar.id) ?? "",
                                    characterId: assignedChar.id
                                  })
                                }
                                className="flex items-center gap-1.5 text-bone cursor-grab active:cursor-grabbing truncate"
                              >
                                <ClassSpecIcon wowClass={assignedChar.class} spec={assignedChar.spec} />
                                <span className="truncate">{assignedChar.name}</span>
                                {assignedChar.canRaidLead && <RaidLeadBadge />}
                                <EnchantBadge character={assignedChar} />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
    </div>
  );
}
