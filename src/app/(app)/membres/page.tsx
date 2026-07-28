"use client";
import { useEffect, useState } from "react";
import { CLASS_LABELS, type WowClass } from "@/lib/classes";

interface MemberCharacter {
  id: string;
  name: string;
  class: WowClass;
  spec: string;
  isActive: boolean;
  canRaidLead: boolean;
}

interface Member {
  id: string;
  discordTag: string;
  displayName: string | null;
  siteRole: "RAIDEUR" | "OFFICIER" | "ADMINISTRATEUR";
  isArchived: boolean;
  characters: MemberCharacter[];
}

const ROLE_LABELS: Record<Member["siteRole"], string> = {
  RAIDEUR: "Raideur",
  OFFICIER: "Officier",
  ADMINISTRATEUR: "Administrateur"
};

export default function MembresPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/members");
    if (res.ok) {
      setMembers(await res.json());
    } else {
      setError("Accès refusé — cette page est réservée aux Officiers.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleArchive(member: Member) {
    const action = member.isArchived ? "réactiver" : "archiver";
    if (!confirm(`Confirmer : ${action} ${member.displayName || member.discordTag} ?`)) return;
    await fetch(`/api/members/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: !member.isArchived })
    });
    load();
  }

  if (loading) return <p className="font-ui text-sm text-bone/50">Chargement...</p>;
  if (error) return <p className="font-ui text-sm text-blood">{error}</p>;

  const q = search.trim().toLowerCase();
  const filtered = members.filter((m) => {
    if (!q) return true;
    const name = (m.displayName || m.discordTag).toLowerCase();
    return name.includes(q) || m.characters.some((c) => c.name.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <p className="font-display text-lg text-bone">Membres</p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher un membre ou un personnage..."
        className="w-full max-w-md bg-void border border-bone/15 focus-ring px-3 py-2 font-ui text-sm text-bone"
      />

      {filtered.length === 0 ? (
        <p className="font-ui text-sm text-bone/50">Aucun résultat.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className={`war-border bg-char p-4 ${m.isArchived ? "opacity-50" : ""}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-display text-sm text-bone">{m.displayName || m.discordTag}</p>
                  <p className="font-ui text-xs text-bone/50">
                    {ROLE_LABELS[m.siteRole]}
                    {m.isArchived && " · Parti(e)"}
                  </p>
                </div>
                <button
                  onClick={() => toggleArchive(m)}
                  className={`font-ui text-[10px] shrink-0 focus-ring ${
                    m.isArchived ? "text-moss hover:text-bone" : "text-bone/30 hover:text-blood"
                  }`}
                >
                  {m.isArchived ? "Réactiver" : "Archiver"}
                </button>
              </div>

              {m.characters.length === 0 ? (
                <p className="font-ui text-xs text-bone/30">Aucun personnage</p>
              ) : (
                <ul className="space-y-0.5">
                  {m.characters.map((c) => (
                    <li key={c.id} className={`font-ui text-xs ${c.isActive ? "text-bone/70" : "text-bone/25"}`}>
                      {c.name} — {CLASS_LABELS[c.class]} ({c.spec})
                      {!c.isActive && " · archivé"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
