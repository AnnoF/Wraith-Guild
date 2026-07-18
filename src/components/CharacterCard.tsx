"use client";
import { CLASS_LABELS, type WowClass } from "@/lib/classes";
import { PROFESSION_LABELS, type Profession } from "@/lib/professions";

export interface CharacterData {
  id: string;
  name: string;
  class: WowClass;
  spec: string;
  isActive: boolean;
  professions: { profession: Profession; isMaxed: boolean }[];
}

export default function CharacterCard({
  character,
  onToggleActive
}: {
  character: CharacterData;
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
  return (
    <div className={`war-border bg-char p-4 flex items-center justify-between ${!character.isActive ? "opacity-50" : ""}`}>
      <div>
        <p className="font-display text-sm text-bone">{character.name}</p>
        <p className="font-ui text-xs text-bone/60 mt-0.5">
          {CLASS_LABELS[character.class]} · {character.spec}
        </p>
        {character.professions.length > 0 && (
          <p className="font-ui text-xs text-bone/40 mt-0.5">
            {character.professions
              .map((p) => `${PROFESSION_LABELS[p.profession]}${p.isMaxed ? " (max)" : ""}`)
              .join(" · ")}
          </p>
        )}
      </div>
      <button
        onClick={() => onToggleActive(character.id, !character.isActive)}
        className="font-ui text-xs text-bone/50 hover:text-bone focus-ring underline"
      >
        {character.isActive ? "Archiver" : "Réactiver"}
      </button>
    </div>
  );
}
