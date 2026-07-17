import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignInButton from "@/components/SignInButton";

export default async function HomePage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard/personnages");

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <p className="font-ui text-xs tracking-[0.3em] uppercase text-blood/90 mb-3">
          Registre de guilde
        </p>
        <h1 className="font-display text-5xl text-bone mb-4">Wraith-Guild</h1>
        <p className="font-ui text-bone/60 mb-10 leading-relaxed">
          L'accès est réservé aux membres du Discord de guilde possédant le
          statut Raideur ou Officier.
        </p>

        {searchParams.error && (
          <p className="font-ui text-sm text-blood mb-6 war-border px-4 py-3 bg-char">
            Connexion refusée : votre compte Discord ne dispose pas d'un rôle
            reconnu sur le serveur de la guilde. Contactez un Officier si
            c'est une erreur.
          </p>
        )}

        <SignInButton />
      </div>
    </main>
  );
}
