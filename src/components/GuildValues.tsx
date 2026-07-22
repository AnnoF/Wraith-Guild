import { GUILD_VALUES } from "@/lib/guildInfo";

const ICONS: Record<string, React.ReactNode> = {
  Respect: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12l4-4 3 3 5-5 4 4M2 12v4h4M22 12v4h-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "Régularité": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Entraide: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20.8 4.6a5 5 0 00-7.1 0L12 6.3l-1.7-1.7a5 5 0 10-7.1 7.1L12 20.3l8.8-8.6a5 5 0 000-7.1z" strokeLinejoin="round" />
    </svg>
  ),
  "Bonne humeur": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

export default function GuildValues() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {GUILD_VALUES.map((value) => (
        <div key={value.label} className="text-center">
          <div className="text-blood flex justify-center mb-2">{ICONS[value.label]}</div>
          <p className="font-display text-sm text-bone">{value.label}</p>
          <p className="font-ui text-xs text-bone/50 mt-1">{value.description}</p>
        </div>
      ))}
    </div>
  );
}
