"use client";
import { signIn } from "next-auth/react";

export default function SignInButton({
  callbackUrl = "/dashboard/personnages",
  label = "Se connecter avec Discord"
}: {
  callbackUrl?: string;
  label?: string;
}) {
  return (
    <button
      onClick={() => signIn("discord", { callbackUrl })}
      className="font-display text-sm inline-flex items-center gap-2 px-6 py-3
                 bg-blood hover:bg-blood/85 transition-colors
                 text-void font-medium focus-ring"
    >
      {label}
    </button>
  );
}
