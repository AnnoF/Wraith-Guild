"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CLASS_LABELS } from "@/lib/classes";
import type { CharacterData } from "@/components/CharacterCard";

interface Signup {
  id: string;
  status: "INSCRIT" | "RESERVE" | "ABSENT" | "DESISTE";
  character: { id: string; name: string; class: keyof typeof CLASS_LABELS; spec: string };
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

const STATUS_LABEL: Record<Signup["status"], string> = {
  INSCRIT: "Inscrit",
  RESERVE: "Réserve",
  ABSENT: "Absent",
  DESISTE: "Désisté"
};

export default function RaidDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [raid, setRaid] = useState<RaidDetail | null>(null);
  const [myCharacters, setMyCharacters] = useState<CharacterData[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [raidRes, charsRes] = await Promise.all([
      fetch(`/api/raids/${id}`),
      fetch("/api/characters")
    ]);
    if (raidRes.ok) setRaid(await raidRes.json());
    if (charsRes.ok) setMyCharacters((await charsRes.json()).filter((c: CharacterData) => c.isActive));
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selectedCharacter) return;

    const res = await fetch(`/api/raids/${id}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId: selectedCharacter })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Impossible de s'inscrire.");
      return;
    }
    setSelectedCharacter("");
    load();
  }

  async function handleWithdraw(characterId: string) {
    await fetch(`/api/raids/${id}/signup`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId })
    });
    load();
  }

  if (!raid) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  const activeSignups = raid.signups.filter((s) => s.status === "INSCRIT" || s.status === "RESERVE");
  const myCharacterIds = new Set(myCharacters.map((c) => c.id));
  const myActiveSignupCharIds = new Set(
    raid.signups.filter((s) => myCharacterIds.has(s.character.id) && (s.status === "INSCRIT" || s.status === "RESERVE")).map((s) => s.character.id)
  );
  const eligibleCharacters = myCharacters.filter((c) => !myActiveSignupCharIds.has(c.id));

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

      {raid.status === "OUVERT" && eligibleCharacters.length > 0 && (
        <form onSubmit={handleSignup} className="war-border bg-char p-5 flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
              S'inscrire avec
            </label>
            <select
              value={selectedCharacter}
              onChange={(e) => setSelectedCharacter(e.target.value)}
              className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
            >
              <option value="">— Choisir un personnage —</option>
              {eligibleCharacters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({CLASS_LABELS[c.class]})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="font-display text-xs bg-blood text-void font-medium px-5 py-2.5 focus-ring">
            S'inscrire
          </button>
        </form>
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
              <div>
                <span className="font-ui text-sm text-bone">{s.character.name}</span>
                <span className="font-ui text-xs text-bone/50 ml-2">
                  {CLASS_LABELS[s.character.class]} · {s.character.spec}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {s.status === "RESERVE" && (
                  <span className="font-ui text-[10px] uppercase text-amber">Réserve</span>
                )}
                {myCharacterIds.has(s.character.id) && (
                  <button
                    onClick={() => handleWithdraw(s.character.id)}
                    className="font-ui text-xs text-bone/40 hover:text-blood focus-ring underline"
                  >
                    Se désinscrire
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
