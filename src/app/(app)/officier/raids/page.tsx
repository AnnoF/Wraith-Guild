"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import RaidCard, { type RaidData } from "@/components/RaidCard";

export default function GererRaidsPage() {
  const [raids, setRaids] = useState<RaidData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/raids")
      .then((res) => res.json())
      .then((data) => {
        setRaids(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg text-bone">Gérer les raids</p>
        <Link
          href="/officier/raids/nouveau"
          className="font-display text-xs bg-blood text-void font-medium px-4 py-2 focus-ring"
        >
          + Nouveau raid
        </Link>
      </div>

      {loading ? (
        <p className="font-ui text-sm text-bone/50">Chargement...</p>
      ) : raids.length === 0 ? (
        <p className="font-ui text-sm text-bone/50">Aucun raid pour l'instant.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {raids.map((r) => (
            <RaidCard key={r.id} raid={r} href={`/officier/raids/${r.id}/composition`} />
          ))}
        </div>
      )}
    </div>
  );
}
