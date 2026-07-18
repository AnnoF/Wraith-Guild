import { redirect } from "next/navigation";

// L'entrée /dashboard renvoie directement sur l'onglet par défaut
export default function DashboardIndex() {
  redirect("/dashboard/personnages");
}
