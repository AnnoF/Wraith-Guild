import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PublicNavbar from "@/components/PublicNavbar";
import HeroBanner from "@/components/HeroBanner";
import GuildShowcase from "@/components/GuildShowcase";
import FloatingActionBar from "@/components/FloatingActionBar";

export default async function HomePage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, { error }] = await Promise.all([getServerSession(authOptions), searchParams]);
  // Un compte CANDIDAT reste sur la vitrine publique : /dashboard le
  // renverrait de toute façon vers /candidature (voir (app)/layout.tsx),
  // donc le rediriger ici créerait une boucle et l'empêcherait de revenir
  // sur la page d'accueil.
  if (session && session.user.siteRole !== "CANDIDAT") redirect("/dashboard");

  return (
    <main className="min-h-screen">
      <PublicNavbar isCandidateLoggedIn={session?.user.siteRole === "CANDIDAT"} />

      {error && (
        <p className="font-ui text-sm text-garnet text-center gilt-frame rounded-sm px-4 py-3 bg-char max-w-md mx-auto mt-6">
          Connexion refusée : une erreur est survenue lors de la vérification
          de votre compte Discord. Réessayez dans un instant.
        </p>
      )}

      <HeroBanner />
      <GuildShowcase />
      <FloatingActionBar />
    </main>
  );
}
