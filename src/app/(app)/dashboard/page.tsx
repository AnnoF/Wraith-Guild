"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CLASS_LABELS } from "@/lib/classes";
import { PROFESSION_LABELS } from "@/lib/professions";
import RaidCard, { type RaidData } from "@/components/RaidCard";
import type { CharacterData } from "@/components/CharacterCard";

export default function DashboardHomePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [raids, setRaids] = useState<RaidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/characters").then((res) => res.json()),
      fetch("/api/raids?when=upcoming").then((res) => res.json())
    ]).then(([chars, upcomingRaids]) => {
      setCharacters(chars);
      setRaids(upcomingRaids);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (session?.user.name) setDisplayName(session.user.name);
  }, [session?.user.name]);

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setSavingName(true);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName })
    });
    setSavingName(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setNameError(data.error || "Erreur lors de la mise à jour.");
      return;
    }
    await updateSession();
    router.refresh();
  }

  if (loading) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  const activeCharacters = characters.filter((c) => c.isActive);

  return (
    <div className="space-y-8">
      <p className="font-display text-lg text-bone">Accueil</p>

      <div className="war-border bg-char p-4 max-w-md">
        <p className="font-display text-sm text-bone mb-2">Mon nom d'affichage</p>
        <form onSubmit={handleSaveName} className="flex items-end gap-2">
          <div className="flex-1">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={32}
              placeholder="Pseudo affiché sur le site"
              className="w-full bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
            />
          </div>
          <button
            type="submit"
            disabled={savingName}
            className="font-display text-xs bg-blood text-void font-medium px-4 py-2 disabled:opacity-50 focus-ring"
          >
            {savingName ? "..." : "Enregistrer"}
          </button>
        </form>
        {nameError && <p className="font-ui text-xs text-blood mt-2">{nameError}</p>}
        <p className="font-ui text-xs text-bone/40 mt-2">Videz le champ pour revenir à votre pseudo Discord.</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-sm text-bone">Mes personnages</p>
          <Link href="/dashboard/personnages" className="font-ui text-xs text-bone/50 hover:text-bone">
            Gérer mes personnages →
          </Link>
        </div>
        {activeCharacters.length === 0 ? (
          <p className="font-ui text-sm text-bone/50">
            Aucun personnage actif.{" "}
            <Link href="/dashboard/personnages" className="underline hover:text-bone">
              Crées-en un
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeCharacters.map((c) => (
              <div key={c.id} className="war-border bg-char p-4">
                <p className="font-display text-sm text-bone">{c.name}</p>
                <p className="font-ui text-xs text-bone/60 mt-0.5">
                  {CLASS_LABELS[c.class]} · {c.spec}
                </p>
                {c.professions.length > 0 && (
                  <p className="font-ui text-xs text-bone/40 mt-0.5">
                    {c.professions.map((p) => PROFESSION_LABELS[p.profession]).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="font-display text-sm text-bone">Raids à venir</p>
          <Link href="/dashboard/raids-a-venir" className="font-ui text-xs text-bone/50 hover:text-bone">
            Voir tous les raids à venir →
          </Link>
        </div>
        {raids.length === 0 ? (
          <p className="font-ui text-sm text-bone/50">Aucun raid à venir pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {raids.slice(0, 6).map((r) => (
              <RaidCard key={r.id} raid={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
