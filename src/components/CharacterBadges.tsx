import { guessRaidRole, type WowClass } from "@/lib/classes";
import type { Profession } from "@/lib/professions";

export interface BadgeCharacter {
  class: WowClass;
  spec: string;
  professions: { profession: Profession; isMaxed: boolean }[];
}

// Puces visuelles pour repérer d'un coup d'œil les tanks, soigneurs et
// enchanteurs maxés lors de la construction d'une composition de raid.
export default function CharacterBadges({ character }: { character: BadgeCharacter }) {
  const role = guessRaidRole(character.class, character.spec);
  const enchantMaxed = character.professions.some(
    (p) => p.profession === "ENCHANTING" && p.isMaxed
  );

  if (role === "DPS" && !enchantMaxed) return null;

  return (
    <span className="inline-flex items-center gap-1">
      {role === "TANK" && (
        <span title="Tank" aria-label="Tank" className="text-amber">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l8 3.2v6.1c0 5.1-3.4 9.4-8 10.7-4.6-1.3-8-5.6-8-10.7V5.2L12 2z" />
          </svg>
        </span>
      )}
      {role === "SOIGNEUR" && (
        <span title="Soigneur" aria-label="Soigneur" className="text-moss">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10.5 2h3v8.5H22v3h-8.5V22h-3v-8.5H2v-3h8.5V2z" />
          </svg>
        </span>
      )}
      {enchantMaxed && (
        <span title="Enchanting maxed" aria-label="Enchanting maxed" className="text-sky-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 2l1.2 3.3L10.5 6.5 7.2 7.7 6 11 4.8 7.7 1.5 6.5 4.8 5.3 6 2z" />
            <path d="M17 6l1.6 4.4L23 12l-4.4 1.6L17 18l-1.6-4.4L11 12l4.4-1.6L17 6z" />
          </svg>
        </span>
      )}
    </span>
  );
}
