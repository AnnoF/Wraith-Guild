import { MAIN_ALT_BADGE_LETTERS, MAIN_ALT_LABELS, type MainAltStatus } from "@/lib/mainAlt";

// Lettre en gras/majuscule tout à droite du cadre du personnage en
// composition de raid : "M" (Main), "MA" (Main Alt), "A" (Alt).
export default function MainAltBadge({ status }: { status: MainAltStatus }) {
  return (
    <span
      title={MAIN_ALT_LABELS[status]}
      aria-label={MAIN_ALT_LABELS[status]}
      className="font-bold uppercase text-bone shrink-0 ml-auto"
    >
      {MAIN_ALT_BADGE_LETTERS[status]}
    </span>
  );
}
