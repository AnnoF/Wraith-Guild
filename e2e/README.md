# Tests E2E Playwright

Couvre les parcours critiques du site (connexion/rôles, personnages,
inscription à un raid, composition, candidatures, admin) contre un vrai
navigateur, un vrai serveur Next.js et une vraie base Postgres — **dédiée
aux tests**, jamais la base de production.

## Pourquoi une base à part sur le VPS

Il n'y a pas de Postgres local sur ce poste. Les tests tournent contre le
Postgres du VPS, mais **dans une base séparée `wraithguild_test`**, jamais
`wraithguild` (celle de prod) : `global-setup.ts` vide entièrement ses
tables avant chaque run, un run malheureux sur la mauvaise base effacerait
de vraies données de guilde.

## Mise en place (une fois)

1. Sur le VPS, en tant qu'utilisateur Postgres autorisé :

   ```sql
   CREATE DATABASE wraithguild_test;
   CREATE USER wraithguild_test_user WITH PASSWORD 'choisir_un_mot_de_passe';
   GRANT ALL PRIVILEGES ON DATABASE wraithguild_test TO wraithguild_test_user;
   \c wraithguild_test
   GRANT ALL ON SCHEMA public TO wraithguild_test_user;
   ```

2. Copier `.env.test.example` en `.env.test` (jamais commité) et renseigner
   `DATABASE_URL` avec ce mot de passe (host `localhost`, le tunnel SSH
   ci-dessous fait le pont vers le VPS).

3. Ouvrir un tunnel SSH vers le Postgres du VPS, à garder ouvert pendant les
   runs de tests :

   ```bash
   ssh -L 5432:localhost:5432 <votre_utilisateur>@51.210.247.13 -N
   ```

4. Appliquer le schéma sur la base de test (une fois, puis à chaque
   changement de `prisma/schema.prisma`) :

   ```bash
   set -a && . ./.env.test 2>/dev/null; set +a; npx prisma db push
   ```

   (sous PowerShell : charger `DATABASE_URL` depuis `.env.test` dans la
   session avant `npx prisma db push`, ou passer temporairement la variable
   en ligne de commande.)

## Lancer les tests

Avec le tunnel SSH ouvert :

```bash
npm run test:e2e
```

`playwright.config.ts` démarre lui-même `npm run dev` (webServer) et vide/
reseed la base de test avant le run — inutile de lancer le serveur à la
main. `npm run test:e2e:ui` ouvre le mode interactif Playwright.

## Comment fonctionne la connexion sans Discord réel

Le vrai flux OAuth Discord n'est pas automatisable dans un test. À la
place, `e2e/helpers/session.ts` signe directement un cookie de session
NextAuth (JWT/JWE) avec `NEXTAUTH_SECRET`, pour un utilisateur créé en base
via `e2e/helpers/db.ts`. Aucun code de `src/lib/auth.ts` n'est modifié pour
ça — voir la fixture `signInAs` dans `e2e/fixtures.ts`, utilisée par chaque
test : `await signInAs("RAIDEUR")`.

Conséquence : le dépôt initial d'une candidature (qui vérifie
l'appartenance Discord réelle via le bot, voir
`src/app/api/applications/me/route.ts`) n'est pas testé en E2E — hors de
portée sans un vrai bot + serveur Discord de test. `candidature.spec.ts`
part d'une candidature déjà semée en base et couvre le reste du parcours
(suivi de statut, échange, décision officier).

`DISCORD_BOT_TOKEN`/`DISCORD_GUILD_ID` sont optionnels dans `.env.test`. Si
renseignés (vos vraies valeurs de prod), les appels à l'API Discord partent
réellement mais échouent proprement (le `discordId` fabriqué des comptes de
test, ex. `e2e-1786...`, n'est pas un snowflake Discord valide → erreur 400,
rattrapée sans bloquer la requête) : ça n'élargit pas la couverture de
test, juste le chemin de code exercé. Sans ces variables, l'échec est
immédiat (erreur de config, même comportement rattrapé derrière). Dans les
deux cas, aucune vraie donnée de guilde n'est lue ni modifiée.

## Isolation des données

La suite tourne en série (`workers: 1`) et chaque test crée ses propres
utilisateurs/personnages/raids avec des identifiants uniques — pas de
fixtures partagées mutables entre specs, pour éviter les résultats
dépendants de l'ordre d'exécution.
