import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { APPLICATION_INFO_SECTIONS } from "@/lib/applicationInfo";
import CandidatureForm from "./CandidatureForm";

export default async function CandidaturePage() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen">
      <header className="border-b-2 border-blood bg-char">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo_net.png" alt="" className="h-8 w-8" style={{ clipPath: "circle(47%)" }} />
            <span className="font-display text-lg text-bone">Wraith</span>
          </Link>
          <Link href="/" className="font-ui text-xs text-bone/50 hover:text-bone">
            ← Retour à l'accueil
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <h1 className="font-display text-3xl text-blood uppercase tracking-wide">Candidature</h1>

        <div className="space-y-8">
          {APPLICATION_INFO_SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-lg text-bone mb-2">{section.heading}</h2>
              <p className="font-ui text-sm text-bone/70 leading-relaxed whitespace-pre-line">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <CandidatureForm
          loggedIn={!!session}
          defaultDiscordTag={session?.user.name ?? ""}
        />
      </div>
    </main>
  );
}
