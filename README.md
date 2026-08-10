# Wraith-Guild

Site de gestion de guilde pour Camelote (WoW Classic-like) : recrutement,
personnages, inscriptions et compositions de raid.

Production : https://wraith-guild.fr

## Fonctionnalités

- **Recrutement** : formulaire de candidature en ligne, suivi et échange
  avec le candidat côté Officier, notifications Discord (webhook + DM)
- **Personnages** : plusieurs personnages par joueur (classe, spé, jusqu'à
  2 métiers), archivage plutôt que suppression pour préserver l'historique
- **Raids** : planification d'un ou plusieurs donjons le même soir, date
  limite d'inscription, statut calculé automatiquement à l'affichage
- **Compositions** : constructeur de composition par les Officiers, avec un
  mode avancé d'assignation de rôles par boss
- **Suivi de guilde** : annuaire des membres, statistiques de présence,
  mode vacances (mise en absent automatique), guide de raid, Hall of Fame
- **Vitrine publique** : progression de guilde, état du recrutement,
  médiathèque (captures d'écran, clips et streams Twitch)

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Prisma + PostgreSQL
- NextAuth (Discord OAuth) avec vérification des rôles Discord via un bot
- Tailwind CSS
- Vitest (tests unitaires) + Playwright (tests E2E)
- GitHub Actions (CI + déploiement automatique), PM2 en production

## Prérequis

- Node.js 20+
- PostgreSQL (local ou distant)
- Une application Discord (pour l'OAuth et le bot de vérification des rôles)

## Installation locale

```bash
npm install
cp .env.example .env   # puis remplir les valeurs
npx prisma db push
npm run dev
```

Le projet n'utilise pas (encore) d'historique de migrations Prisma : le
schéma est appliqué avec `prisma db push`, en local comme en production.

### Variables d'environnement

Voir `.env.example`. Les noms de rôles Discord (`DISCORD_ROLE_RAIDEUR`,
`DISCORD_ROLE_OFFICIER`) sont sensibles à la casse et doivent correspondre
exactement aux rôles du serveur Discord de la guilde.

Deux variables sont optionnelles : `DISCORD_APPLICATIONS_WEBHOOK_URL` et
`DISCORD_RAID_WEBHOOK_URL`. Sans elles, les notifications Discord
correspondantes sont simplement désactivées.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | build de production |
| `npm run start` | démarre le build de production |
| `npm run type-check` | vérification TypeScript (`tsc --noEmit`) |
| `npm test` | tests unitaires (Vitest) |
| `npm run test:watch` | tests unitaires en mode watch |
| `npm run test:e2e` | tests E2E (Playwright) — voir prérequis ci-dessous |
| `npm run test:e2e:ui` | tests E2E en mode interactif |
| `npm run prisma:generate` | régénère le client Prisma |
| `npm run prisma:studio` | ouvre Prisma Studio |

## Tests

**Tests unitaires** — couvrent les modules de `src/lib/` (classes et
spécialisations, tailles de raid, statuts, semaine WoW, recrutement…). Les
fichiers sont placés à côté du code testé (`src/lib/classes.test.ts`). Ils ne
demandent ni base de données ni réseau :

```bash
npm test
```

**Tests E2E** — couvrent les parcours critiques (accès par rôle,
personnages, inscription à un raid, composition, candidature, admin) dans un
vrai navigateur, contre une vraie base Postgres.

⚠️ Ils tournent contre une base **dédiée** `wraithguild_test`, dont ils
vident les tables avant chaque run — jamais la base de production. Ils
demandent aussi un tunnel SSH vers le Postgres du VPS. La procédure complète
(création de la base, `.env.test`, tunnel) est décrite dans
[`e2e/README.md`](e2e/README.md) :

```bash
npm run test:e2e
```

## CI / Déploiement

Le déploiement est automatique. `.github/workflows/ci-cd.yml` définit :

- un job **CI** sur chaque pull request et chaque push vers `main` :
  `prisma generate`, `type-check`, tests unitaires, `build` ;
- un job **déploiement** sur push vers `main` uniquement, une fois le CI
  vert : connexion SSH au VPS, qui déclenche le script `deploy.sh` du
  serveur (`git pull`, `npm ci`, `prisma generate`, `prisma db push`,
  `build`, `pm2 restart`).

Autrement dit, **un merge sur `main` part en production tout seul**,
changement de schéma compris. Les tests E2E ne font pas partie du pipeline
(ils demandent un accès direct à la base) : ils se lancent à la main.

La clé SSH utilisée par le workflow est restreinte côté serveur à
l'exécution de ce seul script. Les secrets GitHub `DEPLOY_HOST`,
`DEPLOY_USER` et `DEPLOY_SSH_KEY` doivent être renseignés dans les settings
du dépôt.

### Installation initiale du VPS

```bash
git clone https://github.com/AnnoF/Wraith-Guild.git
cd Wraith-Guild
cp .env.example .env   # remplir avec les vraies valeurs de production
npm install
npx prisma db push
npm run build
pm2 start npm --name wraith-guild -- start
pm2 save
```

Configurer ensuite Nginx en reverse proxy vers `localhost:3000` et Certbot
pour le certificat SSL.

Les mises à jour suivantes passent par le pipeline ci-dessus. En secours, se
connecter au VPS et lancer `/var/www/Wraith-Guild/deploy.sh` à la main.

Note : les images ajoutées depuis le site (Hall of Fame) sont écrites dans
`public/uploads/`, qui est hors de git — à sauvegarder séparément.

## Rôles

- **Candidat** : rôle par défaut à la première connexion ; accès limité à
  son espace de candidature
- **Raideur** : peut créer ses personnages et s'inscrire aux raids ouverts
- **Officier** : peut en plus configurer les raids, gérer les compositions,
  traiter les candidatures et consulter membres/présence
- **Administrateur** : peut en plus attribuer les rôles des autres membres

N'importe quel compte Discord peut se connecter, mais il reste Candidat tant
qu'il n'a pas le rôle Discord `Raideur` ou `Officier` sur le serveur de la
guilde. Le rôle site n'est déterminé depuis Discord qu'à la création du
compte : il est ensuite géré manuellement depuis la page d'administration.

## Structure

```
src/
  app/
    page.tsx        vitrine publique + connexion
    candidature/    formulaire public de candidature
    galerie/        médiathèque publique
    (app)/          pages protégées (dashboard, raids, officier, admin…)
    api/            routes API
  components/       composants réutilisables
  lib/              auth, prisma, Discord, classes/spés, raids, uploads…
                    (+ tests unitaires *.test.ts à côté du code)
prisma/
  schema.prisma     modèle de données
e2e/                tests Playwright (voir e2e/README.md)
.github/workflows/  CI + déploiement automatique
```
