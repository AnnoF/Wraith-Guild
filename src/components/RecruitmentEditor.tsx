"use client";
import { useState } from "react";
import type { RecruitmentPriority } from "@prisma/client";
import { CLASS_LABELS, CLASS_SPECS, WOW_CLASSES } from "@/lib/classes";
import { RECRUITMENT_COLUMN_META, RECRUITMENT_PRIORITIES, groupByColumn, specKey } from "@/lib/recruitment";
import ClassSpecIcon from "./ClassSpecIcon";

type RecruitmentStatus = Record<string, RecruitmentPriority>;

export default function RecruitmentEditor({
  initialStatus,
  canEdit
}: {
  initialStatus: RecruitmentStatus;
  canEdit: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const columns = groupByColumn(editing ? draft : status);

  function startEditing() {
    setDraft(status);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setDraft(status);
    setError(null);
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const entries = WOW_CLASSES.flatMap((wowClass) =>
      CLASS_SPECS[wowClass].map((spec) => ({ wowClass, spec, priority: draft[specKey(wowClass, spec)] }))
    );
    const res = await fetch("/api/recruitment", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries })
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erreur lors de l'enregistrement.");
      return;
    }
    const updated = await res.json();
    setStatus(updated);
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex items-center justify-end gap-3">
          {error && <p className="font-ui text-xs text-garnet">{error}</p>}
          {editing ? (
            <>
              <button onClick={cancelEditing} className="font-ui text-xs text-bone/50 hover:text-bone focus-ring">
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="font-display text-xs bg-gold text-void font-medium rounded-full px-4 py-2 disabled:opacity-50 focus-ring"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </>
          ) : (
            <button onClick={startEditing} className="font-ui text-xs text-bone/50 hover:text-bone focus-ring">
              Éditer l&apos;état du recrutement
            </button>
          )}
        </div>
      )}

      {editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {WOW_CLASSES.map((wowClass) => (
            <div key={wowClass} className="bg-char border border-bone/10 rounded-sm p-3 space-y-2">
              <p className="font-display text-xs text-bone/70 tracking-[0.08em]">{CLASS_LABELS[wowClass]}</p>
              {CLASS_SPECS[wowClass].map((spec) => {
                const key = specKey(wowClass, spec);
                return (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="font-ui text-sm text-bone">{spec}</span>
                    <select
                      value={draft[key]}
                      onChange={(e) =>
                        setDraft((prev) => ({ ...prev, [key]: e.target.value as RecruitmentPriority }))
                      }
                      className="bg-void border border-bone/15 rounded-sm focus-ring px-2 py-1 font-ui text-xs text-bone"
                    >
                      {RECRUITMENT_PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {RECRUITMENT_COLUMN_META[priority].label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {columns.map((col) => (
            <div key={col.priority} className="flex items-center gap-4">
              <span className={`font-display text-xs w-16 shrink-0 ${col.textClass}`}>{col.label}</span>
              <div className={`flex gap-1.5 flex-wrap p-1.5 ${col.tintClass}`}>
                {col.specs.map(({ wowClass, spec }) => (
                  <ClassSpecIcon
                    key={`${wowClass}-${spec}`}
                    wowClass={wowClass}
                    spec={spec}
                    size="h-9 w-9"
                    className={col.iconClass}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
