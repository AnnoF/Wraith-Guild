"use client";
import { useEffect, useState } from "react";
import CharacterForm from "@/components/CharacterForm";
import CharacterCard, { type CharacterData } from "@/components/CharacterCard";

export default function PersonnagesPage() {
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function loadCharacters() {
    setLoading(true);
    const res = await fetch("/api/characters");
    if (res.ok) setCharacters(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadCharacters();
  }, []);

  async function handleToggleActive(id: string, isActive: boolean) {
    await fetch(`/api/characters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive })
    });
    loadCharacters();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-lg text-bone">Mes personnages</p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="font-display text-xs bg-blood text-void font-medium px-4 py-2 focus-ring"
        >
          {showForm ? "Fermer" : "+ Nouveau personnage"}
        </button>
      </div>

      {showForm && (
        <CharacterForm
          onCreated={() => {
            setShowForm(false);
            loadCharacters();
          }}
        />
      )}

      {loading ? (
        <p className="font-ui text-sm text-bone/50">Chargement...</p>
      ) : characters.length === 0 ? (
        <p className="font-ui text-sm text-bone/50">
          Aucun personnage pour l'instant. Crée-en un pour pouvoir t'inscrire aux raids.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} onToggleActive={handleToggleActive} />
          ))}
        </div>
      )}
    </div>
  );
}
