// Texte de présentation affiché sur /candidature avant le formulaire.
// Contenu fourni par la guilde, reproduit fidèlement (juste restructuré
// en sections + puces pour la lecture web).

export interface ApplicationInfoSection {
  heading: string;
  body: string;
}

export const APPLICATION_INFO_SECTIONS: ApplicationInfoSection[] = [
  {
    heading: "Objectifs de la guilde",
    body: `Réunir des joueurs avec un objectif commun : découvrir à nouveau le contenu de WoW Classic+ tout en gardant une exigence de niveau de jeu.

PvE : clean tout le contenu de raid à chaque reset hebdomadaire (1-3 soirs / semaine, suivant le contenu disponible). Nous n'avons actuellement pas pour projet de faire la course aux first kills, les raids ont pour objectif principal de s'équiper et s'amuser en découvrant le contenu. Nous aspirons malgré tout à maintenir un niveau de jeu élevé et à être parmi les guildes les plus avancées du serveur en matière de raid.

PvP : le PvP est une activité optionnelle qui sera organisée entre les joueurs intéressés (nous avons quelques membres aimant battre le fer) :
• BG Premade (groupe 10 optimisé avec spés/crafts PvP, consos, ...)
• BG Casual / Relax
• World PvP / outdoor, ganking`
  },
  {
    heading: "Profil idéalement recherché",
    body: `Joueurs expérimentés (si pas expérimenté : avoir la volonté de faire des efforts pour se mettre rapidement au niveau attendu) et matures qui partagent les mêmes objectifs décrits ci-dessus.

Volonté de participer aux activités de guilde (donjons, craft, aide s'il y a des joueurs moins expérimentés) et inclusion dans la guilde en entretenant une atmosphère détendue et agréable et en communiquant sur Discord et/ou via le /g.`
  },
  {
    heading: "Ce qui ne nous intéresse pas",
    body: `Joueurs qui ne supportent pas la critique constructive et/ou de recevoir de l'aide, et qui au final ne font pas l'effort et/ou ne sont pas capables de se mettre au niveau attendu.

Les joueurs qui ne participent aucunement à la vie de guilde, ne parlent pas sur Discord, se connectent systématiquement à 20h pour le raid et s'en vont à 23h59 deux fois par semaine.

Joueurs immatures (générateurs de drama, lootwhores, crient en vocal, comportements toxiques, …).`
  },
  {
    heading: "Structure de la guilde",
    body: `Guild Master(s)
• Gestion générale de la guilde
• Définition de la politique et des objectifs de la guilde
• Définition des rôles et responsabilités
• Recrutement
• Attributions (Loot Council)

Officiers
• Coordination entre classes (ex : définir et communiquer la stratégie de heal sur un combat)
• Attributions (Loot Council)
• Organisation/répartition des spécialisations
• Communication des BiS/Loot List

Member
• Attendance & performance élevée en raid
• Farm du BiS pré-raid et utilisation régulière de consommables/buffs qui augmentent les performances
• Aide des autres joueurs de leur classe si nécessaire

Apply
• Démonstration de la capacité à passer "Member" (objectifs similaires)

Casual / Social
• Entretenir une bonne atmosphère dans la guilde !
• Contribuer à l'effort de guilde en participant aux donjons, PvP et autres événements (si possible)`
  },
  {
    heading: "Attribution des places en RAID",
    body: `Member > Apply > Casual / Social
(sauf si besoin de composition de roster spécifique, ex : besoin de tranqshot / stuff resist)

Bien que nous essaierons de faire participer tout le monde, en cas de surnombre, la ponctualité, l'investissement et la performance seront pris en compte dans l'attribution des places.`
  },
  {
    heading: "Politique loots",
    body: `Modèle utilisé pour la répartition des loots : Loot Council. La philosophie de distribution qui sera implémentée est décrite ci-dessous.

Ordre de priorité : Main (BiS) > Main > Apply > Casual / Social > Alt

• Un item BiS pour une classe devrait toujours aller sur cette classe-là en priorité.
• Les attributions "sensibles" (items "prestigieux" : légendaires, armes, … ; items rares : rings/trinkets, ...) seront pré-établies avant le raid, pour : éviter la perte de temps pendant le raid, éviter les mauvaises surprises / dramas, et trouver l'équilibre entre homogénéité du raid et récompense de l'investissement.
• Les BiS et loots "prestigieux" iront sur les membres les plus investis en priorité (attendance, farm stuff pré-raid & consos, aide des autres guildmates, optimisation).
• Pas de priorité absolue sur le reste des loots, afin de tendre vers une itemization homogène du raid et récompenser les joueurs pour leur participation en raid.
• Certains sets peuvent être attribués séquentiellement / sur un joueur à la fois, afin d'atteindre un bonus de set et d'augmenter plus rapidement la performance du raid.`
  }
];

export const APPLICATION_WEEKDAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche"
];
