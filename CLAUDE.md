# Wraith-Guild — Contexte du projet

Site de gestion de guilde pour **Camelote**, un futur opus de World of
Warcraft basé sur WoW Classic/Vanilla (aucune information officielle sur le
jeu pour l'instant — sortie prévue dans quelques mois). Le site sert à gérer
les inscriptions, les personnages et les compositions de raid de la guilde.

Dépôt : https://github.com/AnnoF/Wraith-Guild
Domaine de production : https://wraith-guild.fr (VPS OVH)

## Stack technique

- Next.js 14 (App Router) + TypeScript
- Prisma + PostgreSQL
- NextAuth avec provider Discord OAuth
- Tailwind CSS
- PM2 (process manager en production)

## Concept fonctionnel

### Rôles du site (3 niveaux)
- **Raideur** : peut créer des personnages et s'inscrire aux raids ouverts
- **Officier** : peut en plus configurer les raids et gérer les compositions
  (constructeur de composition : passer un inscrit en réserve, le retirer,
  changer le statut du raid)
- **Administrateur** : peut en plus attribuer/changer les rôles des autres
  utilisateurs (page `/admin`)

Ces rôles sont stockés en base (`User.siteRole`), gérés manuellement une
fois l'utilisateur créé — ils ne sont **pas** re-synchronisés automatiquement
à chaque connexion depuis Discord, pour éviter qu'un décalage de synchro ou
un bot en panne ne retire les droits de quelqu'un par erreur.

### Connexion / contrôle d'accès Discord
La connexion au site se fait uniquement via Discord OAuth. Un bot Discord
(intent "Server Members") vérifie, à la connexion, que le membre possède un
rôle Discord autorisé sur le serveur de guilde. **Seuls les noms de rôles
Discord suivants sont actuellement acceptés** (configurés via variables
d'environnement, voir plus bas) :
- Rôle "Raideur" (site) ↔ rôle Discord **`Member`**
- Rôle "Officier" (site, valeur par défaut à la première connexion) ↔ rôle
  Discord **`Officers`**

⚠️ Ces noms sont sensibles à la casse côté Discord. Si la guilde renomme ses
rôles Discord, mettre à jour `DISCORD_ROLE_RAIDEUR` / `DISCORD_ROLE_OFFICIER`
dans le `.env` de production (pas dans le code).

### Personnages
Un utilisateur peut créer plusieurs personnages : nom, classe (parmi Prêtre,
Mage, Démoniste, Druide, Voleur, Chasseur, Chaman, Guerrier, Paladin), et une
spécialisation dépendante de la classe (mapping dans `src/lib/classes.ts`).
Les personnages ne sont jamais supprimés en dur, seulement archivés
(`isActive: false`) pour ne pas casser l'historique des raids passés.

### Raids
Tailles supportées : 10, 20, 25, 40 joueurs (le format réel de Camelote
n'étant pas encore connu, ce champ reste un simple entier libre côté schéma,
pas un enum figé). Statuts : `OUVERT`, `FERME`, `TERMINE`, `ANNULE`.

### Inscriptions
Un personnage s'inscrit à un raid ouvert. Statuts possibles :
`INSCRIT`, `RESERVE` (bench), `ABSENT`, `DESISTE`. Les Officiers peuvent
faire basculer un inscrit entre ces statuts depuis le constructeur de
composition (`/officier/raids/[id]/composition`).

## Structure du code

```
src/
  app/
    page.tsx                          page d'accueil / connexion
    dashboard/                        layout protégé + navbar
      personnages/                    onglet "Mes personnages"
      raids-a-venir/                  onglet "Raids à venir"
      raids-passes/                   onglet "Raids passés"
    raids/[id]/                       détail d'un raid + inscription
    officier/raids/nouveau/           création d'un raid (Officier+)
    officier/raids/[id]/composition/  constructeur de composition (Officier+)
    admin/                            gestion des rôles (Administrateur)
    api/                              routes API (characters, raids, admin/users)
  components/                        Navbar, CharacterForm, CharacterCard, RaidCard, SignInButton
  lib/
    auth.ts                          config NextAuth + vérif rôle Discord + helpers canConfigureRaids/canManageRoles
    discord.ts                       appels à l'API Discord (bot) pour lire les rôles d'un membre
    classes.ts                       mapping classe → spécialisations → rôle de raid (tank/heal/dps)
    prisma.ts                        client Prisma partagé
prisma/schema.prisma                 modèle de données (User, Character, Raid, RaidSignup, RoleAudit)
```

## Design — identité visuelle

Direction validée : **inspirée de la Horde**, pas médiévale/parchemin (une
première direction parchemin/or a été essayée puis abandonnée).

- Palette : noir quasi pur (`#0D0B0A` fond, `#161210` cartes), rouge sang
  comme unique accent (`#A61B1B`), texte "os" (`#EDE7E0`), touches ambre
  (`#C98A2C`) et vert mousse (`#7A9B5C`) réservées aux badges de statut
- Typographie : **Oswald** (condensée, majuscules) pour les titres/UI forte,
  **Inter** pour le texte courant
- Formes anguleuses plutôt qu'arrondies : bordure gauche épaisse (`war-border`
  dans `globals.css`), sceau de rôle en biseau (`clip-path` polygon)
- Ne pas réintroduire de courbes/dorures type parchemin médiéval — direction
  tranchée volontairement plus "camp de guerre" que "taverne"
- Attention copyright : ne jamais reproduire l'emblème officiel de la Horde
  (propriété Blizzard), seulement s'inspirer de la palette/l'ambiance

## Infrastructure de production

- **Hébergement** : VPS OVH, Ubuntu 24.04 LTS, IP `51.210.247.13`
- **Nom de domaine** : `wraith-guild.fr`, acheté chez Hostinger, DNS (A + CNAME
  www) pointé vers le VPS
- **Base de données** : PostgreSQL sur le VPS lui-même, base `wraithguild`,
  utilisateur dédié `wraithguild_user`
- **Reverse proxy** : Nginx (`/etc/nginx/sites-available/wraith-guild`) vers
  `localhost:3000`, avec certificat SSL Certbot (Let's Encrypt)
- **Process manager** : PM2, process nommé `wraith-guild`
- **Code déployé dans** : `/var/www/Wraith-Guild` sur le VPS
- **Accès SSH** : sécurisé par clé (mot de passe désactivé pour root),
  pare-feu UFW actif (SSH, 80, 443 uniquement)

### Variables d'environnement requises (`.env`, jamais commité)
```
DATABASE_URL
NEXTAUTH_URL=https://wraith-guild.fr
NEXTAUTH_SECRET
DISCORD_CLIENT_ID
DISCORD_CLIENT_SECRET
DISCORD_BOT_TOKEN
DISCORD_GUILD_ID
DISCORD_ROLE_RAIDEUR=Member
DISCORD_ROLE_OFFICIER=Officers
```
Les valeurs réelles existent uniquement dans le `.env` sur le VPS (et
localement si besoin de tester) — ne jamais les redemander à l'utilisateur
pour les mettre dans un fichier versionné, ne jamais les committer.

### Point d'attention Prisma
Il n'existe pas encore de dossier `prisma/migrations` versionné : la base de
prod a été initialisée avec `npx prisma db push`, pas `migrate deploy`. Si un
changement de schéma est nécessaire, décider avec l'utilisateur s'il veut
initialiser un vrai historique de migrations (`prisma migrate dev` en local
puis `migrate deploy` en prod) plutôt que de continuer au `db push`.

### Workflow de déploiement actuel (manuel, pas de CI/CD)
Sur le VPS, après un `git push` depuis le poste de travail :
```bash
cd /var/www/Wraith-Guild
git pull
npm install            # si les dépendances ont changé
npx prisma db push     # si le schéma a changé
npm run build
pm2 restart wraith-guild
```

## État d'avancement

Le site est **déployé et fonctionnel en production** (auth Discord testée
avec succès, thème Horde en ligne). L'utilisateur prévoit de nombreux
changements à venir sur le site — rien de figé, itérer librement sur les
pages/fonctionnalités existantes selon ses demandes.
