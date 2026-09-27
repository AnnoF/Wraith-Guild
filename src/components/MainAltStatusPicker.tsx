"use client";
import { useEffect } from "react";
import {
  MAIN_ALT_STATUSES,
  MAIN_ALT_LABELS,
  availableMainAltStatuses,
  shouldAutoSelectAlt,
  type MainAltStatus
} from "@/lib/mainAlt";

// Choix exclusif et obligatoire Main / Main Alt / Alt, utilisé à la
// création (CharacterForm) et pendant l'édition tant que le personnage
// n'est pas encore verrouillé sur Main/Main Alt (CharacterCard). Auto-coche
// "Alt" dès que Main et Main Alt sont déjà pris par d'autres personnages du
// joueur (voir shouldAutoSelectAlt).
export default function MainAltStatusPicker({
  value,
  onChange,
  siblingStatuses
}: {
  value: MainAltStatus | "";
  onChange: (status: MainAltStatus) => void;
  siblingStatuses: MainAltStatus[];
}) {
  const available = availableMainAltStatuses(siblingStatuses);

  useEffect(() => {
    if (shouldAutoSelectAlt(siblingStatuses) && value !== "ALT") {
      onChange("ALT");
    }
  }, [siblingStatuses, value, onChange]);

  return (
    <div>
      <label className="font-ui text-xs uppercase tracking-wide text-bone/60 block mb-1">
        Statut du personnage
      </label>
      <div className="flex gap-4">
        {MAIN_ALT_STATUSES.map((status) => {
          const disabled = !available.includes(status);
          return (
            <label
              key={status}
              className={`flex items-center gap-1.5 font-ui text-sm ${
                disabled ? "text-bone/30" : "text-bone/80"
              }`}
            >
              <input
                type="radio"
                name="mainAltStatus"
                checked={value === status}
                disabled={disabled}
                onChange={() => onChange(status)}
                className="accent-gold"
              />
              {MAIN_ALT_LABELS[status]}
            </label>
          );
        })}
      </div>
    </div>
  );
}
