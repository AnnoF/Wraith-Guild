"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CLASS_LABELS } from "@/lib/classes";
import { PROFESSION_LABELS } from "@/lib/professions";
import RaidCard, { type RaidData } from "@/components/RaidCard";
import type { CharacterData } from "@/components/CharacterCard";

export default function DashboardHomePage() {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [raids, setRaids] = useState<RaidData[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;

  const activeCharacters = characters.filter((c) => c.isActive);

  return (
    <div className="space-y-8">
      <p className="font-display text-lg text-bone">Accueil</p>

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
