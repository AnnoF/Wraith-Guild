"use client";
import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("discord", { callbackUrl: "/dashboard/personnages" })}
      className="font-display text-sm inline-flex items-center gap-2 px-6 py-3
                 bg-blood hover:bg-blood/85 transition-colors
                 text-void font-medium focus-ring"
    >
      Se connecter avec Discord
    </button>
  );
}
