import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import PublicNavbar from "@/components/PublicNavbar";
import HeroBanner from "@/components/HeroBanner";
import GuildShowcase from "@/components/GuildShowcase";

export default async function HomePage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen">
      <PublicNavbar />

      {searchParams.error && (
        <p className="font-ui text-sm text-blood text-center war-border px-4 py-3 bg-char max-w-md mx-auto mt-6">
          Connexion refusée : une erreur est survenue lors de la vérification
          de votre compte Discord. Réessayez dans un instant.
        </p>
      )}

      <HeroBanner />

      <div className="max-w-5xl mx-auto px-6 py-16">
        <GuildShowcase />
      </div>
    </main>
  );
}
