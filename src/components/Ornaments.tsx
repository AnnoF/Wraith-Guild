// Petits motifs décoratifs originaux (pas d'assets Blizzard) utilisés pour
// appuyer l'ambiance "tome ancien" de la vitrine : un filet doré sous les
// titres de section, et une volute discrète dans les coins des bandes.

export function GoldRule({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 12" className={`h-3 w-24 ${className}`} aria-hidden="true">
      <line x1="0" y1="6" x2="88" y2="6" stroke="url(#gold-rule-gradient)" strokeWidth="1.5" />
      <line x1="112" y1="6" x2="200" y2="6" stroke="url(#gold-rule-gradient)" strokeWidth="1.5" />
      <rect x="96" y="2" width="8" height="8" transform="rotate(45 100 6)" fill="var(--gold)" />
      <defs>
        <linearGradient id="gold-rule-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CornerFlourish({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={`h-12 w-12 text-gold/30 ${className}`}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 2v18c0 8 6 14 14 14h18" strokeLinecap="round" />
      <path d="M2 2c10 0 16 4 16 14" strokeLinecap="round" />
      <circle cx="34" cy="34" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
