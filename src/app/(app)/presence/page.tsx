"use client";
import { useEffect, useState } from "react";

interface MemberPresence {
  id: string;
  discordTag: string;
  displayName: string | null;
  siteRole: "RAIDEUR" | "OFFICIER" | "ADMINISTRATEUR";
  isArchived: boolean;
  present: number;
  absent: number;
  deserter: number;
  totalRaids: number;
  rate: number | null;
}

const ROLE_LABELS: Record<MemberPresence["siteRole"], string> = {
  RAIDEUR: "Raideur",
  OFFICIER: "Officier",
  ADMINISTRATEUR: "Administrateur"
};

export default function PresencePage() {
  const [members, setMembers] = useState<MemberPresence[]>([]);
  const [totalRaids, setTotalRaids] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/presence").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members);
        setTotalRaids(data.totalRaids);
      } else {
        setError("Accès refusé — cette page est réservée aux Officiers.");
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;
  if (error) return <p className="font-ui text-sm text-blood">{error}</p>;

  return (
    <div className="space-y-6">
      <p className="font-display text-lg text-bone">Présence</p>
      <p className="font-ui text-sm text-bone/50">
        Calculée sur {totalRaids} raid{totalRaids > 1 ? "s" : ""} passé{totalRaids > 1 ? "s" : ""} (hors annulés).
        Présent : inscrit et placé en composition, ou en réserve. Absent : signalé absent. Déserteur : ni l'un ni
        l'autre (pas inscrit, ou désisté).
      </p>

      {members.length === 0 ? (
        <p className="font-ui text-sm text-bone/50">Aucun membre.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full font-ui text-sm text-left">
            <thead>
              <tr className="border-b border-bone/15 text-bone/50 text-xs uppercase tracking-wide">
                <th className="py-2 pr-4">Membre</th>
                <th className="py-2 px-4">Rôle</th>
                <th className="py-2 px-4 text-center text-moss">Présent</th>
                <th className="py-2 px-4 text-center text-amber">Absent</th>
                <th className="py-2 px-4 text-center text-blood">Déserteur</th>
                <th className="py-2 pl-4 text-right">Taux de présence</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className={`border-b border-bone/5 ${m.isArchived ? "opacity-40" : ""}`}>
                  <td className="py-2 pr-4 text-bone">
                    {m.displayName || m.discordTag}
                    {m.isArchived && <span className="text-bone/40"> (parti·e)</span>}
                  </td>
                  <td className="py-2 px-4 text-bone/60">{ROLE_LABELS[m.siteRole]}</td>
                  <td className="py-2 px-4 text-center text-bone">{m.present}</td>
                  <td className="py-2 px-4 text-center text-bone">{m.absent}</td>
                  <td className="py-2 px-4 text-center text-bone">{m.deserter}</td>
                  <td className="py-2 pl-4 text-right text-bone">
                    {m.rate === null ? "—" : `${Math.round(m.rate * 100)}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
