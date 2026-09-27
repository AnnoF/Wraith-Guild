"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { WOW_CLASSES, CLASS_LABELS, CLASS_COLORS, guessRaidRole, type WowClass, type RaidRole } from "@/lib/classes";
import type { Profession } from "@/lib/professions";
import { GROUP_SIZE, GRID_COLS, groupRows } from "@/lib/raidGroups";
import { RAID_BOSS_ROLES, type BossRoles } from "@/lib/bossRoles";
import { encodeProgram } from "@/lib/raidInstances";
import ClassSpecIcon from "@/components/ClassSpecIcon";
import EnchantBadge from "@/components/EnchantBadge";
import RaidLeadBadge from "@/components/RaidLeadBadge";
import WeekLockBadge from "@/components/WeekLockBadge";
import RankBadge from "@/components/RankBadge";
import MainAltBadge from "@/components/MainAltBadge";
import type { MainAltStatus } from "@/lib/mainAlt";

const ROLE_TAGS: { value: RaidRole; label: string }[] = [
  { value: "TANK", label: "Tank" },
  { value: "SOIGNEUR", label: "Healer" },
  { value: "DPS", label: "DPS" }
];

interface CharacterOption {
  id: string;
  name: string;
  class: WowClass;
  spec: string;
  professions: { profession: Profession; isMaxed: boolean }[];
  canRaidLead: boolean;
  mainAltStatus: MainAltStatus;
  weekLocked?: boolean;
}

interface Signup {
  id: string;
  status: "INSCRIT" | "RESERVE" | "ABSENT" | "DESISTE";
  comment: string | null;
  wantsBench: boolean;
  user: { id: string; discordTag: string; siteRole: string; characters: CharacterOption[] };
}

interface PlacementData {
  id: string;
  slot: number;
  signupId: string;
  characterId: string;
  character: CharacterOption;
}

interface BossRoleAssignmentData {
  id: string;
  boss: string;
  role: string;
  characterId: string | null;
  character: CharacterOption | null;
}

interface RunData {
  id: string;
  title: string;
  size: number;
  order: number;
  placements: PlacementData[];
  bossRoleAssignments: BossRoleAssignmentData[];
}

interface PhaseData {
  id: string;
  order: number;
  runs: RunData[];
}

interface RaidDetail {
  id: string;
  name: string;
  status: string;
  notes: string | null;
  signups: Signup[];
  phases: PhaseData[];
}

interface DragPayload {
  userId: string;
  characterId: string;
}

// Constructeur de composition : le joueur s'est inscrit sans choisir de
// personnage, pour toute la soirée. À gauche, la liste des inscrits avec
// leurs personnages (glissables) ; au centre, une grille de groupes de 5
// par instance de la phase sélectionnée, où l'Officier dépose le
// personnage retenu pour chaque joueur. Un joueur ne peut être placé que
// dans une seule instance par phase (elles se déroulent en même temps).
export default function CompositionPage() {
  const { id } = useParams<{ id: string }>();
  const [raid, setRaid] = useState<RaidDetail | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [advancedRunId, setAdvancedRunId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null); // `${runId}:${slot}`
  const [search, setSearch] = useState("");
  const [roleFilters, setRoleFilters] = useState<Set<RaidRole>>(new Set());
  const [classFilters, setClassFilters] = useState<Set<WowClass>>(new Set());
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

  async function updateSignup(
    userId: string,
    data: { runId?: string; slot?: number | null; characterId?: string | null; status?: string }
  ) {
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

  function toggleRoleFilter(role: RaidRole) {
    setRoleFilters((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  function toggleClassFilter(cls: WowClass) {
    setClassFilters((prev) => {
      const next = new Set(prev);
      if (next.has(cls)) next.delete(cls);
      else next.add(cls);
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setRoleFilters(new Set());
    setClassFilters(new Set());
  }

  function handleDragStart(e: React.DragEvent, payload: DragPayload) {
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(e: React.DragEvent, runId: string, slot: number) {
    e.preventDefault();
    setDragOverSlot(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload: DragPayload = JSON.parse(raw);
    updateSignup(payload.userId, { runId, characterId: payload.characterId, slot });
  }

  async function assignBossRole(runId: string, boss: string, role: string, characterId: string | null) {
    const res = await fetch(`/api/raids/${id}/boss-roles`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, boss, role, characterId })
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Impossible d'assigner ce rôle.");
    } else {
      setError(null);
    }
    load();
  }

  function handleBossDrop(e: React.DragEvent, runId: string, boss: string, role: string) {
    e.preventDefault();
    setDragOverBossRole(null);
    const raw = e.dataTransfer.getData("application/json");
    if (!raw) return;
    const payload: DragPayload = JSON.parse(raw);
    assignBossRole(runId, boss, role, payload.characterId);
  }

  if (!raid) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  const players = raid.signups.filter((s) => s.status === "INSCRIT");
  const benched = raid.signups.filter((s) => s.status === "RESERVE");
  const absentSignups = raid.signups.filter((s) => s.status === "ABSENT");

  const phase = raid.phases[phaseIndex] as PhaseData | undefined;

  // Placement de chaque inscrit au sein de la phase sélectionnée (au plus
  // un, dans une seule des instances concurrentes de cette phase).
  const placementBySignup = new Map<string, { run: RunData; placement: PlacementData }>();
  phase?.runs.forEach((run) => {
    run.placements.forEach((p) => placementBySignup.set(p.signupId, { run, placement: p }));
  });
  const placedInPhase = players.filter((s) => placementBySignup.has(s.id));
  const unplacedInPhase = players.filter((s) => !placementBySignup.has(s.id));

  const roleGroups = { TANK: 0, SOIGNEUR: 0, DPS: 0 };
  placedInPhase.forEach((s) => {
    const character = placementBySignup.get(s.id)!.placement.character;
    const role = guessRaidRole(character.class, character.spec);
    roleGroups[role]++;
  });

  const phaseCapacity = phase?.runs.reduce((sum, r) => sum + r.size, 0) ?? 0;

  function handleQuickAssign(runId: string, runSize: number, userId: string, characterId: string) {
    const run = phase?.runs.find((r) => r.id === runId);
    const occupiedSlots = new Set(run?.placements.map((p) => p.slot));
    for (let slot = 0; slot < runSize; slot++) {
      if (!occupiedSlots.has(slot)) {
        updateSignup(userId, { runId, characterId, slot });
        return;
      }
    }
  }

  // Les tags rôle/classe s'accumulent sur un même personnage (ex: Healer +
  // Druid ne retient que les personnages qui sont à la fois Druide et
  // healer, pas un joueur ayant un healer d'un côté et un Druide de
  // l'autre sur deux personnages différents).
  function matchesFilters(s: Signup) {
    const chars = s.user.characters;
    if (roleFilters.size > 0 || classFilters.size > 0) {
      const hasMatchingCharacter = chars.some((c) => {
        const roleOk = roleFilters.size === 0 || roleFilters.has(guessRaidRole(c.class, c.spec));
        const classOk = classFilters.size === 0 || classFilters.has(c.class);
        return roleOk && classOk;
      });
      if (!hasMatchingCharacter) return false;
    }
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return s.user.discordTag.toLowerCase().includes(q) || chars.some((c) => c.name.toLowerCase().includes(q));
  }

  const filtersActive = search.trim() !== "" || roleFilters.size > 0 || classFilters.size > 0;

  // Ceux qui ont indiqué préférer bench à l'inscription restent inscrits
  // (status INSCRIT) : ce n'est qu'une préférence affichée à l'Officier,
  // qui les liste après ceux qui veulent raid mais ne les bascule jamais
  // en réserve automatiquement (voir wantsBench sur RaidSignup).
  const filteredUnplaced = unplacedInPhase.filter(matchesFilters).filter((s) => !s.wantsBench);
  const filteredUnplacedWantBench = unplacedInPhase.filter(matchesFilters).filter((s) => s.wantsBench);
  const filteredPlaced = placedInPhase.filter(matchesFilters);
  const filteredBenched = benched.filter(matchesFilters);
  const filteredAbsent = absentSignups.filter(matchesFilters);

  const activeRun = phase?.runs.find((r) => r.id === advancedRunId) ?? phase?.runs[0] ?? null;
  const bossTemplate = activeRun ? RAID_BOSS_ROLES[activeRun.title] ?? [] : [];
  const bossAssignmentMap = new Map<string, BossRoleAssignmentData>();
  activeRun?.bossRoleAssignments.forEach((a) => bossAssignmentMap.set(`${a.boss}|${a.role}`, a));
  const characterOwnerMap = new Map<string, string>();
  phase?.runs.forEach((run) => {
    run.placements.forEach((p) => characterOwnerMap.set(p.characterId, p.signupId));
  });
  const signupUserMap = new Map(raid.signups.map((s) => [s.id, s.user.id]));
  // Rôle site du joueur derrière chaque inscription, pour le badge S/A
  // (Social/Apply) affiché devant le nom d'un personnage placé, voir
  // RankBadge.
  const signupRoleMap = new Map(raid.signups.map((s) => [s.id, s.user.siteRole]));

  const duplicateHref = `/officier/raids/nouveau?name=${encodeURIComponent(raid.name)}&notes=${encodeURIComponent(
    raid.notes ?? ""
  )}&program=${encodeURIComponent(encodeProgram(raid.phases.map((p) => p.runs.map((r) => r.title))))}`;

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 px-6">
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="font-display text-lg text-bone">Composition — {raid.name}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setRaidStatus("OUVERT")}
            className="font-ui text-xs px-3 py-1.5 border border-moss text-moss rounded-full focus-ring"
          >
            Ouvrir
          </button>
          <button
            onClick={() => setRaidStatus("FERME")}
            className="font-ui text-xs px-3 py-1.5 border border-amber text-amber rounded-full focus-ring"
          >
            Fermer les inscriptions
          </button>
          <button
            onClick={() => setRaidStatus("TERMINE")}
            className="font-ui text-xs px-3 py-1.5 border border-bone/30 text-bone/60 rounded-full focus-ring"
          >
            Marquer comme terminé
          </button>
          <button
            onClick={() => {
              if (confirm("Annuler ce raid ? Les inscriptions seront fermées.")) setRaidStatus("ANNULE");
            }}
            className="font-ui text-xs px-3 py-1.5 border border-garnet text-garnet rounded-full focus-ring"
          >
            Annuler le raid
          </button>
          <Link
            href={duplicateHref}
            className="font-ui text-xs px-3 py-1.5 border border-bone/30 text-bone/60 hover:text-bone rounded-full focus-ring"
          >
            Dupliquer ce raid
          </Link>
        </div>
      </div>

      {raid.phases.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {raid.phases.map((p, i) => (
            <button
              key={p.id}
              onClick={() => {
                setPhaseIndex(i);
                setAdvancedRunId(null);
              }}
              className={`font-ui text-xs px-3 py-1.5 border rounded-full focus-ring ${
                i === phaseIndex ? "bg-gold text-void border-gold font-medium" : "border-bone/20 text-bone/60 hover:text-bone"
              }`}
            >
              Phase {i + 1} — {p.runs.map((r) => r.title).join(" + ")}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-4 font-ui text-xs text-bone/60">
        <span>Tanks : {roleGroups.TANK}</span>
        <span>Healers : {roleGroups.SOIGNEUR}</span>
        <span>DPS : {roleGroups.DPS}</span>
        <span>Inscrits : {players.length}</span>
        <span>Placés (phase) : {placedInPhase.length} / {phaseCapacity}</span>
        {benched.length > 0 && <span>Réserve : {benched.length}</span>}
        {absentSignups.length > 0 && <span>Absents : {absentSignups.length}</span>}
      </div>

      {error && (
        <p className="font-ui text-xs text-garnet gilt-frame rounded-sm bg-char px-4 py-2.5">{error}</p>
      )}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un joueur ou un personnage..."
            className="bg-void border border-bone/15 rounded-sm focus-ring px-3 py-1.5 font-ui text-xs text-bone w-64"
          />
          <div className="flex gap-1">
            {ROLE_TAGS.map((r) => (
              <button
                key={r.value}
                onClick={() => toggleRoleFilter(r.value)}
                className={`font-ui text-xs px-2.5 py-1.5 border rounded-full focus-ring ${
                  roleFilters.has(r.value)
                    ? "bg-gold text-void border-gold"
                    : "border-bone/20 text-bone/60 hover:text-bone"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {filtersActive && (
            <button
              onClick={clearFilters}
              className="font-ui text-xs text-bone/40 hover:text-garnet focus-ring"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {WOW_CLASSES.map((cls) => {
            const active = classFilters.has(cls);
            const color = CLASS_COLORS[cls];
            return (
              <button
                key={cls}
                onClick={() => toggleClassFilter(cls)}
                style={
                  active
                    ? { backgroundColor: `${color}CC`, borderColor: color }
                    : { borderColor: `${color}66` }
                }
                className={`font-ui text-xs px-2.5 py-1.5 border focus-ring ${
                  active ? "text-void font-semibold" : "text-bone/60 hover:text-bone"
                }`}
              >
                {CLASS_LABELS[cls]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4">
          <p className="font-display text-xs text-bone/50 mb-2">À placer</p>
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
            {players.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Aucun inscrit pour l'instant.</p>
            )}
            {players.length > 0 && unplacedInPhase.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Tous les inscrits sont placés pour cette phase.</p>
            )}
            {unplacedInPhase.length > 0 && filteredUnplaced.length === 0 && filteredUnplacedWantBench.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Aucun résultat pour ces filtres.</p>
            )}
            {filteredUnplaced.map((s) => (
              <div key={s.id} className="gilt-frame rounded-sm bg-char px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-ui text-sm text-bone">{s.user.discordTag}</p>
                  <button
                    onClick={() => updateSignup(s.user.id, { status: "RESERVE" })}
                    title="Mettre en réserve (bench)"
                    className="font-ui text-[10px] text-bone/30 hover:text-amber focus-ring shrink-0"
                  >
                    Bench
                  </button>
                </div>
                {s.comment && <p className="font-ui text-xs text-bone/30 mt-0.5">{s.comment}</p>}
                <div className="mt-1.5 space-y-1">
                  {s.user.characters.length === 0 && (
                    <p className="font-ui text-xs text-bone/30">Aucun personnage actif</p>
                  )}
                  {s.user.characters.map((c) => {
                    const color = CLASS_COLORS[c.class];
                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: c.id })}
                        onDoubleClick={() => {
                          if (phase && phase.runs.length === 1) handleQuickAssign(phase.runs[0].id, phase.runs[0].size, s.user.id, c.id);
                        }}
                        title={phase && phase.runs.length === 1 ? "Double-clic pour placer automatiquement" : undefined}
                        style={{ backgroundColor: `${color}66`, borderColor: `${color}B3` }}
                        className="flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone cursor-grab active:cursor-grabbing"
                      >
                        <RankBadge siteRole={s.user.siteRole} />
                        <ClassSpecIcon wowClass={c.class} spec={c.spec} />
                        <span>{c.name}</span>
                        {c.canRaidLead && <RaidLeadBadge />}
                        <EnchantBadge character={c} />
                        {c.weekLocked && <WeekLockBadge />}
                        <MainAltBadge status={c.mainAltStatus} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Préférence indiquée à l'inscription, pas un statut : le
                joueur reste INSCRIT (disponible, comptabilisé, plaçable)
                tant qu'un Officier n'a pas cliqué "Bench" lui-même. Listé
                après ceux qui veulent raid, personnages ratés en diagonale
                (voir .bench-strike) pour repérer la préférence en un
                coup d'œil. */}
            {filteredUnplacedWantBench.length > 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-[10px] uppercase tracking-wide text-bone/40 mt-2">
                Préférence bench
              </p>
            )}
            {filteredUnplacedWantBench.map((s) => (
              <div key={s.id} className="gilt-frame rounded-sm bg-char px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-ui text-sm text-bone">{s.user.discordTag}</p>
                  <button
                    onClick={() => updateSignup(s.user.id, { status: "RESERVE" })}
                    title="Confirmer la mise en réserve (bench)"
                    className="font-ui text-[10px] text-bone/30 hover:text-amber focus-ring shrink-0"
                  >
                    Bench
                  </button>
                </div>
                {s.comment && <p className="font-ui text-xs text-bone/30 mt-0.5">{s.comment}</p>}
                <div className="mt-1.5 space-y-1">
                  {s.user.characters.length === 0 && (
                    <p className="font-ui text-xs text-bone/30">Aucun personnage actif</p>
                  )}
                  {s.user.characters.map((c) => {
                    const color = CLASS_COLORS[c.class];
                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: c.id })}
                        onDoubleClick={() => {
                          if (phase && phase.runs.length === 1) handleQuickAssign(phase.runs[0].id, phase.runs[0].size, s.user.id, c.id);
                        }}
                        title={phase && phase.runs.length === 1 ? "Double-clic pour placer automatiquement" : undefined}
                        style={{ backgroundColor: `${color}66`, borderColor: `${color}B3` }}
                        className="bench-strike relative flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone cursor-grab active:cursor-grabbing"
                      >
                        <RankBadge siteRole={s.user.siteRole} />
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

            {/* Les joueurs réellement mis en réserve (par un Officier, ou
                automatiquement à la fermeture des inscriptions) restent
                toujours listés après ceux qui veulent raid, leurs
                personnages affichés avec une rature diagonale (voir
                .bench-strike) — ils restent glissables si un Officier veut
                les placer. */}
            {benched.length > 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-[10px] uppercase tracking-wide text-bone/40 mt-2">
                Réserve
              </p>
            )}
            {benched.length > 0 && filteredBenched.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Aucun résultat pour ces filtres.</p>
            )}
            {filteredBenched.map((s) => (
              <div key={s.id} className="gilt-frame rounded-sm bg-char px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-ui text-sm text-bone/80">{s.user.discordTag}</p>
                  <button
                    onClick={() => updateSignup(s.user.id, { status: "INSCRIT" })}
                    title="Retirer de la réserve"
                    className="font-ui text-[10px] text-bone/30 hover:text-moss focus-ring shrink-0"
                  >
                    Réinscrire
                  </button>
                </div>
                {s.comment && <p className="font-ui text-xs text-bone/30 mt-0.5">{s.comment}</p>}
                <div className="mt-1.5 space-y-1">
                  {s.user.characters.length === 0 && (
                    <p className="font-ui text-xs text-bone/30">Aucun personnage actif</p>
                  )}
                  {s.user.characters.map((c) => {
                    const color = CLASS_COLORS[c.class];
                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: c.id })}
                        style={{ backgroundColor: `${color}66`, borderColor: `${color}B3` }}
                        className="bench-strike relative flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone cursor-grab active:cursor-grabbing"
                      >
                        <RankBadge siteRole={s.user.siteRole} />
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

        <div className="lg:w-1/2 space-y-4">
          {!phase && <p className="font-ui text-sm text-bone/50">Aucune phase programmée.</p>}
          {phase?.runs.map((run) => {
            const slotMap = new Map<number, PlacementData>();
            run.placements.forEach((p) => slotMap.set(p.slot, p));
            const numGroups = Math.ceil(run.size / GROUP_SIZE);
            return (
              <div key={run.id} className="space-y-2">
                <p className="font-display text-xs text-bone/60">{run.title} <span className="text-bone/30">({run.size} joueurs)</span></p>
                <div className="space-y-3">
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
                              const key = `${run.id}:${slot}`;
                              return (
                                <div
                                  key={key}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOverSlot(key);
                                  }}
                                  onDragLeave={() => setDragOverSlot((cur) => (cur === key ? null : cur))}
                                  onDrop={(e) => handleDrop(e, run.id, slot)}
                                  style={
                                    classColor && dragOverSlot !== key
                                      ? { backgroundColor: `${classColor}66`, borderColor: `${classColor}80` }
                                      : undefined
                                  }
                                  className={`min-h-[28px] px-2 py-1 border font-ui text-xs flex items-center justify-between gap-1 ${
                                    dragOverSlot === key
                                      ? "border-gold bg-gold/10"
                                      : occupant
                                      ? ""
                                      : "border-dashed border-bone/10 text-bone/20"
                                  }`}
                                >
                                  {occupant ? (
                                    <>
                                      <span
                                        draggable
                                        onDragStart={(e) =>
                                          handleDragStart(e, {
                                            userId: signupUserMap.get(occupant.signupId) ?? "",
                                            characterId: occupant.characterId
                                          })
                                        }
                                        className="flex items-center gap-1.5 text-bone cursor-grab active:cursor-grabbing truncate"
                                      >
                                        <RankBadge siteRole={signupRoleMap.get(occupant.signupId)} />
                                        <ClassSpecIcon wowClass={occupant.character.class} spec={occupant.character.spec} />
                                        <span className="truncate">{occupant.character.name}</span>
                                        {occupant.character.canRaidLead && <RaidLeadBadge />}
                                        <EnchantBadge character={occupant.character} />
                                        <MainAltBadge status={occupant.character.mainAltStatus} />
                                      </span>
                                      <button
                                        onClick={() =>
                                          updateSignup(signupUserMap.get(occupant.signupId) ?? "", { runId: run.id, slot: null })
                                        }
                                        className="text-bone/30 hover:text-garnet focus-ring shrink-0"
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
              </div>
            );
          })}
        </div>

        <div className="lg:w-1/4">
          <p className="font-display text-xs text-bone/50 mb-2">Placés (phase)</p>
          <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
            {placedInPhase.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Personne de placé pour l'instant.</p>
            )}
            {placedInPhase.length > 0 && filteredPlaced.length === 0 && (
              <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Aucun résultat pour ces filtres.</p>
            )}
            {filteredPlaced.map((s) => {
              const { run, placement } = placementBySignup.get(s.id)!;
              const otherCharacters = s.user.characters.filter((c) => c.id !== placement.characterId);
              return (
                <div key={s.id} className="gilt-frame rounded-sm bg-char px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-ui text-sm text-bone">{s.user.discordTag}</p>
                    <button
                      onClick={() => updateSignup(s.user.id, { status: "RESERVE" })}
                      title="Mettre en réserve (bench)"
                      className="font-ui text-[10px] text-bone/30 hover:text-amber focus-ring shrink-0"
                    >
                      Bench
                    </button>
                  </div>
                  {phase && phase.runs.length > 1 && (
                    <p className="font-ui text-[10px] text-bone/40 mt-0.5">{run.title}</p>
                  )}
                  <div className="mt-1.5 space-y-1">
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: placement.characterId })}
                      style={{
                        backgroundColor: `${CLASS_COLORS[placement.character.class]}66`,
                        borderColor: "var(--amber)"
                      }}
                      className="flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone cursor-grab active:cursor-grabbing"
                    >
                      <RankBadge siteRole={s.user.siteRole} />
                      <ClassSpecIcon wowClass={placement.character.class} spec={placement.character.spec} />
                      <span>{placement.character.name}</span>
                      {placement.character.canRaidLead && <RaidLeadBadge />}
                      <EnchantBadge character={placement.character} />
                      <MainAltBadge status={placement.character.mainAltStatus} />
                    </div>
                    {otherCharacters.map((c) => {
                      const color = CLASS_COLORS[c.class];
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, { userId: s.user.id, characterId: c.id })}
                          style={{ backgroundColor: `${color}33`, borderColor: `${color}66` }}
                          className="flex items-center gap-1.5 font-ui text-xs px-2 py-1 border text-bone/70 cursor-grab active:cursor-grabbing"
                        >
                          <RankBadge siteRole={s.user.siteRole} />
                          <ClassSpecIcon wowClass={c.class} spec={c.spec} />
                          <span>{c.name}</span>
                          {c.canRaidLead && <RaidLeadBadge />}
                          <EnchantBadge character={c} />
                          {c.weekLocked && <WeekLockBadge />}
                          <MainAltBadge status={c.mainAltStatus} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {absentSignups.length > 0 && (
            <>
              <p className="font-display text-xs text-bone/50 mt-4 mb-2">Absents</p>
              <div className="grid grid-cols-4 lg:grid-cols-2 gap-2">
                {filteredAbsent.length === 0 && (
                  <p className="col-span-4 lg:col-span-2 font-ui text-sm text-bone/50">Aucun résultat pour ces filtres.</p>
                )}
                {filteredAbsent.map((s) => (
                  <div key={s.id} className="gilt-frame rounded-sm bg-char px-3 py-2.5 opacity-40">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-ui text-sm text-bone">{s.user.discordTag}</p>
                      <button
                        onClick={() => updateSignup(s.user.id, { status: "INSCRIT" })}
                        title="Réinscrire"
                        className="font-ui text-[10px] text-bone/40 hover:text-moss focus-ring shrink-0"
                      >
                        Réinscrire
                      </button>
                    </div>
                    {s.comment && <p className="font-ui text-xs text-bone/30 mt-0.5">{s.comment}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {phase && phase.runs.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setAdvancedMode((v) => !v)}
            className="font-ui text-xs px-4 py-2 border border-bone/30 text-bone/60 hover:text-bone rounded-full focus-ring"
          >
            {advancedMode ? "Masquer le mode avancé" : "Mode avancé — rôles par boss"}
          </button>
        </div>
      )}

      {advancedMode && phase && (
        <div className="lg:w-1/2 mx-auto space-y-3">
          {phase.runs.length > 1 && (
            <div className="flex justify-center gap-2">
              {phase.runs.map((run) => (
                <button
                  key={run.id}
                  onClick={() => setAdvancedRunId(run.id)}
                  className={`font-ui text-xs px-3 py-1.5 border rounded-full focus-ring ${
                    activeRun?.id === run.id ? "bg-gold text-void border-gold" : "border-bone/20 text-bone/60 hover:text-bone"
                  }`}
                >
                  {run.title}
                </button>
              ))}
            </div>
          )}
          {bossTemplate.length === 0 ? (
            <p className="font-ui text-sm text-bone/50 text-center">
              Pas encore de rôles définis pour {activeRun?.title}.
            </p>
          ) : (
            groupCollapsedRuns(bossTemplate, collapsedBosses).map((group, groupIdx) => {
              if (group.length > 1) {
                const names = group.map((b) => b.boss);
                return (
                  <button
                    key={`group-${groupIdx}`}
                    onClick={() => expandBosses(names)}
                    className="w-full gilt-frame rounded-sm bg-char px-4 py-2.5 flex items-center justify-between gap-3 text-left focus-ring"
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
                <div key={boss} className="gilt-frame rounded-sm bg-char p-4">
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
                            onDrop={(e) => activeRun && handleBossDrop(e, activeRun.id, boss, role.label)}
                            className={`min-h-[44px] px-2 py-1.5 border font-ui text-xs flex flex-col justify-center gap-0.5 ${
                              dragOverBossRole === key
                                ? "border-gold bg-gold/10"
                                : assignedChar
                                ? ""
                                : "border-dashed border-bone/10"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className={assignedChar ? "text-bone/50" : "text-bone/30"}>{role.label}</span>
                              {assignedChar && activeRun && (
                                <button
                                  onClick={() => assignBossRole(activeRun.id, boss, role.label, null)}
                                  className="text-bone/30 hover:text-garnet focus-ring shrink-0"
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
                                    userId: signupUserMap.get(characterOwnerMap.get(assignedChar.id) ?? "") ?? "",
                                    characterId: assignedChar.id
                                  })
                                }
                                className="flex items-center gap-1.5 text-bone cursor-grab active:cursor-grabbing truncate"
                              >
                                <RankBadge
                                  siteRole={signupRoleMap.get(characterOwnerMap.get(assignedChar.id) ?? "")}
                                />
                                <ClassSpecIcon wowClass={assignedChar.class} spec={assignedChar.spec} />
                                <span className="truncate">{assignedChar.name}</span>
                                {assignedChar.canRaidLead && <RaidLeadBadge />}
                                <EnchantBadge character={assignedChar} />
                                <MainAltBadge status={assignedChar.mainAltStatus} />
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
