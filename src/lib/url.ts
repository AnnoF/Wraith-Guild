// N'accepte que des liens http(s) — un schéma comme javascript: rendu tel
// quel en href exécuterait du JS dans la session de qui clique dessus.
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
