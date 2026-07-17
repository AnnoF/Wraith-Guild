import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  return (
    <div className="min-h-screen">
      <Navbar role={session.user.siteRole} discordTag={session.user.name ?? "Membre"} />
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
