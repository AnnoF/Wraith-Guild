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

interface AssignedCharacter {
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
  slot: number | null;
  user: { id: string; discordTag: string };
  character: AssignedCharacter | null;
}

interface RaidDetail {
  id: string;
  title: string;
  date: string;
  size: number;
  status: string;
  notes: string | null;
  signupDeadline: string | null;
  signups: Signup[];
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

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const res = await fetch(`/api/raids/${id}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: comment || undefined })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Impossible de s'inscrire.");
      return;
    }
    setComment("");
    load();
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

  const activeSignups = raid.signups.filter((s) => s.status === "INSCRIT" || s.status === "RESERVE");
  const mySignup = raid.signups.find((s) => s.user.id === session?.user.id);
  const canSignup = !mySignup || mySignup.status === "DESISTE" || mySignup.status === "ABSENT";

  const canConfigure = session?.user.siteRole === "OFFICIER" || session?.user.siteRole === "ADMINISTRATEUR";

  const placed = activeSignups.filter((s) => s.slot !== null && s.character);
  const unplacedCount = activeSignups.filter((s) => s.slot === null).length;
  const slotMap = new Map<number, Signup>();
  placed.forEach((s) => slotMap.set(s.slot!, s));
  const numGroups = Math.ceil(raid.size / GROUP_SIZE);

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

      <div className="war-border bg-char p-5">
        <p className="font-display text-xl text-bone mb-1">{raid.title}</p>
        <p className="font-ui text-sm text-bone/60">
          {new Date(raid.date).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
        </p>
        <p className="font-ui text-sm text-bone/60 mt-1">Taille : {raid.size} joueurs</p>
        {raid.signupDeadline && (
          <p className="font-ui text-xs text-bone/40 mt-1">
            Inscriptions jusqu'au{" "}
            {new Date(raid.signupDeadline).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
          </p>
        )}
        {raid.notes && <p className="font-ui text-sm text-bone/70 mt-3">{raid.notes}</p>}
      </div>

      {raid.status === "OUVERT" && canSignup && (
        <form onSubmit={handleSignup} className="war-border bg-char p-5 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
              Commentaire (optionnel)
            </label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ex. dispo après 21h"
              className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
            />
          </div>
          <button type="submit" className="font-display text-xs bg-blood text-void font-medium px-5 py-2.5 focus-ring">
            S'inscrire
          </button>
        </form>
      )}

      {mySignup && !canSignup && (
        <div className="war-border bg-char p-5 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-ui text-sm text-bone">
              Vous êtes inscrit {mySignup.status === "RESERVE" ? "(réserve)" : ""}
            </p>
            <p className="font-ui text-xs text-bone/50 mt-1">
              {mySignup.character
                ? `Personnage assigné : ${mySignup.character.name} (${CLASS_LABELS[mySignup.character.class]} · ${mySignup.character.spec})`
                : "En attente d'assignation d'un personnage par un Officier."}
            </p>
          </div>
          <button
            onClick={handleWithdraw}
            className="font-ui text-xs text-bone/40 hover:text-blood focus-ring underline"
          >
            Se désinscrire
          </button>
        </div>
      )}
      {error && <p className="font-ui text-xs text-blood">{error}</p>}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-sm text-bone">
            Groupes ({placed.length}/{raid.size})
          </p>
          {unplacedCount > 0 && (
            <p className="font-ui text-xs text-bone/40">{unplacedCount} joueur(s) pas encore placé(s)</p>
          )}
        </div>
        {activeSignups.length === 0 ? (
          <p className="font-ui text-sm text-bone/50">Personne d'inscrit pour l'instant.</p>
        ) : (
          <div className="space-y-3">
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
                            style={classColor ? { backgroundColor: `${classColor}66`, borderColor: `${classColor}80` } : undefined}
                            className={`min-h-[28px] px-2 py-1 border font-ui text-xs flex items-center gap-1.5 ${
                              occupant ? "text-bone" : "border-dashed border-bone/10"
                            }`}
                          >
                            {occupant && occupant.character && (
                              <>
                                <ClassSpecIcon wowClass={occupant.character.class} spec={occupant.character.spec} />
                                <span className="truncate">{occupant.character.name}</span>
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
    </div>
  );
}
