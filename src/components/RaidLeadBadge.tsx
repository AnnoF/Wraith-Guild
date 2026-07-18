// Petite couronne dorée : le joueur se déclare capable de RL ce personnage.
export default function RaidLeadBadge() {
  return (
    <span title="Capable de raid lead" aria-label="Capable de raid lead" className="text-amber shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 8l4 3 5-6 5 6 4-3-2 11H5L3 8zm2.5 12h13v2h-13v-2z" />
      </svg>
    </span>
  );
}
