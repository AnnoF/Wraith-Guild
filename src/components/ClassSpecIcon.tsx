"use client";
import { useState } from "react";
import { CLASS_LABELS, classSpecIconPath, type WowClass } from "@/lib/classes";

export default function ClassSpecIcon({
  wowClass,
  spec,
  size = "h-5 w-5"
}: {
  wowClass: WowClass;
  spec: string;
  size?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={classSpecIconPath(wowClass, spec)}
      alt={`${CLASS_LABELS[wowClass]} - ${spec}`}
      title={`${CLASS_LABELS[wowClass]} - ${spec}`}
      onError={() => setFailed(true)}
      className={`${size} shrink-0 rounded-sm`}
    />
  );
}
