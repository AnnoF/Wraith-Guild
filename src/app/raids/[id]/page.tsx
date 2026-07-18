"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CLASS_LABELS, type WowClass } from "@/lib/classes";
import type { Profession } from "@/lib/professions";
import CharacterBadges from "@/components/CharacterBadges";

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
  user: { id: string; discordTag: string };
  character: AssignedCharacter | null;
}

interface RaidDetail {
  id: string;
  title: string;
  date: string;
  size: number;
  instance: string | null;
  status: string;
  notes: string | null;
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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/raids-a-venir" className="font-ui text-xs text-bone/50 hover:text-bone">
          ← Retour aux raids à venir
        </Link>
      </div>

      <div className="war-border bg-char p-5">
        <p className="font-display text-xl text-bone mb-1">{raid.title}</p>
        <p className="font-ui text-sm text-bone/60">
          {new Date(raid.date).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}
        </p>
        <p className="font-ui text-sm text-bone/60 mt-1">
          Taille : {raid.size} joueurs {raid.instance ? `· ${raid.instance}` : ""}
        </p>
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
        <p className="font-display text-sm text-bone mb-3">
          Inscrits ({activeSignups.filter((s) => s.status === "INSCRIT").length}/{raid.size})
        </p>
        <div className="space-y-2">
          {activeSignups.length === 0 && (
            <p className="font-ui text-sm text-bone/50">Personne d'inscrit pour l'instant.</p>
          )}
          {activeSignups.map((s) => (
            <div key={s.id} className="war-border bg-char px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-ui text-sm text-bone">{s.user.discordTag}</span>
                {s.character ? (
                  <span className="font-ui text-xs text-bone/50">
                    {s.character.name} · {CLASS_LABELS[s.character.class]} · {s.character.spec}
                  </span>
                ) : (
                  <span className="font-ui text-xs text-bone/30">Personnage non assigné</span>
                )}
                {s.character && <CharacterBadges character={s.character} />}
              </div>
              {s.status === "RESERVE" && (
                <span className="font-ui text-[10px] uppercase text-amber">Réserve</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
