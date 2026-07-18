import type { Profession } from "@/lib/professions";

export interface EnchantBadgeCharacter {
  professions: { profession: Profession; isMaxed: boolean }[];
}

// Petites étoiles bleues signalant un personnage Enchanting maxé. Le rôle
// (tank/soigneur) est désormais montré via l'icône classe/spé, voir
// ClassSpecIcon, pas ici.
export default function EnchantBadge({ character }: { character: EnchantBadgeCharacter }) {
  const enchantMaxed = character.professions.some(
    (p) => p.profession === "ENCHANTING" && p.isMaxed
  );
  if (!enchantMaxed) return null;

  return (
    <span title="Enchanting maxed" aria-label="Enchanting maxed" className="text-sky-400 shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 2l1.2 3.3L10.5 6.5 7.2 7.7 6 11 4.8 7.7 1.5 6.5 4.8 5.3 6 2z" />
        <path d="M17 6l1.6 4.4L23 12l-4.4 1.6L17 18l-1.6-4.4L11 12l4.4-1.6L17 6z" />
      </svg>
    </span>
  );
}
