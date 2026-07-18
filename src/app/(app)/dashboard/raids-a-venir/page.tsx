"use client";
import { useEffect, useState } from "react";
import RaidCard, { type RaidData } from "@/components/RaidCard";

export default function RaidsAVenirPage() {
  const [raids, setRaids] = useState<RaidData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/raids?when=upcoming")
      .then((res) => res.json())
      .then((data) => {
        setRaids(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <p className="font-display text-lg text-bone">Raids à venir</p>

      {loading ? (
        <p className="font-ui text-sm text-bone/50">Chargement...</p>
      ) : raids.length === 0 ? (
        <p className="font-ui text-sm text-bone/50">Aucun raid à venir pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {raids.map((r) => (
            <RaidCard key={r.id} raid={r} />
          ))}
        </div>
      )}
    </div>
  );
}
