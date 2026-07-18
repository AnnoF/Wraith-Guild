// Puce "sens interdit" rouge : ce personnage est déjà engagé sur un raid
// du même nom cette semaine (mercredi -> mardi), voir getWowWeekRange.
export default function WeekLockBadge() {
  return (
    <span title="Déjà engagé sur ce raid cette semaine" aria-label="Déjà engagé cette semaine" className="text-blood shrink-0 ml-auto">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="9" />
        <line x1="6" y1="18" x2="18" y2="6" />
      </svg>
    </span>
  );
}
