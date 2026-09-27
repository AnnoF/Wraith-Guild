// Statut Main / Main Alt / Alt d'un personnage (voir Character.mainAltStatus
// dans schema.prisma). Choix obligatoire et exclusif à la création. "Main"
// et "Main Alt" sont chacun limités à un seul personnage par joueur et,
// une fois posés, ne sont plus modifiables (voir isMainAltStatusLocked) ;
// "Alt" reste libre et peut être choisi pour n'importe quel nombre de
// personnages. Utilisé aussi bien côté API (validation) que côté UI
// (CharacterForm, CharacterCard, MainAltBadge en composition de raid).

export const MAIN_ALT_STATUSES = ["MAIN", "MAIN_ALT", "ALT"] as const;

export type MainAltStatus = (typeof MAIN_ALT_STATUSES)[number];

export const MAIN_ALT_LABELS: Record<MainAltStatus, string> = {
  MAIN: "Main",
  MAIN_ALT: "Main Alt",
  ALT: "Alt"
};

// Lettre affichée en gras/majuscule tout à droite du cadre d'un personnage
// en composition de raid (voir MainAltBadge.tsx).
export const MAIN_ALT_BADGE_LETTERS: Record<MainAltStatus, string> = {
  MAIN: "M",
  MAIN_ALT: "MA",
  ALT: "A"
};

export function isMainAltStatusLocked(current: MainAltStatus): boolean {
  return current === "MAIN" || current === "MAIN_ALT";
}

// Statuts que peut encore choisir un joueur pour un personnage donné,
// compte tenu des statuts déjà posés sur ses AUTRES personnages
// (siblingStatuses n'inclut jamais le personnage en cours d'édition).
// "Alt" est toujours disponible ; "Main"/"Main Alt" disparaissent dès que
// l'un de ses autres personnages les a déjà pris.
export function availableMainAltStatuses(siblingStatuses: MainAltStatus[]): MainAltStatus[] {
  const options: MainAltStatus[] = [];
  if (!siblingStatuses.includes("MAIN")) options.push("MAIN");
  if (!siblingStatuses.includes("MAIN_ALT")) options.push("MAIN_ALT");
  options.push("ALT");
  return options;
}

// true si le joueur a déjà un "Main" ET un "Main Alt" parmi ses autres
// personnages : dans ce cas "Alt" est la seule option restante et doit
// être cochée automatiquement pour le personnage en cours.
export function shouldAutoSelectAlt(siblingStatuses: MainAltStatus[]): boolean {
  return siblingStatuses.includes("MAIN") && siblingStatuses.includes("MAIN_ALT");
}

// Valide côté serveur qu'un statut cible est encore permis pour ce
// personnage, compte tenu des statuts de ses autres personnages.
export function canSetMainAltStatus(target: MainAltStatus, siblingStatuses: MainAltStatus[]): boolean {
  if (target === "ALT") return true;
  return !siblingStatuses.includes(target);
}
