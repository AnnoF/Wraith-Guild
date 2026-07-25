"use client";
import { signOut } from "next-auth/react";

export default function SignOutLink({ className }: { className?: string }) {
  return (
    <button onClick={() => signOut({ callbackUrl: "/" })} className={className}>
      Déconnexion
    </button>
  );
}
