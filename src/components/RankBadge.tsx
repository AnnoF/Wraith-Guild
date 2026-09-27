// Lettre en gras, avant les icônes de classe/spé, devant le pseudo d'un
// personnage en composition : "S" pour un joueur Social, "A" pour un
// candidat en cours de test (statut de candidature Apply). Rien pour les
// autres rôles (Member/Officier/Administrateur/Candidat).
export default function RankBadge({ siteRole }: { siteRole?: string }) {
  if (siteRole === "SOCIAL") {
    return (
      <span title="Social" aria-label="Social" className="font-bold text-bone shrink-0">
        S
      </span>
    );
  }
  if (siteRole === "APPLY") {
    return (
      <span title="Apply" aria-label="Apply" className="font-bold text-bone shrink-0">
        A
      </span>
    );
  }
  return null;
}
