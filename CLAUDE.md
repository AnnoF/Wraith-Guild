# Wraith-Guild — Contexte du projet

Site de gestion de guilde pour **World of Warcraft Forever**, un futur opus
de World of Warcraft basé sur WoW Classic/Vanilla, annoncé à la Blizzcon
(sortie prévue dans quelques mois). Le site gère les candidatures de
recrutement, les personnages, les inscriptions et les compositions de raid
de la guilde.

Dépôt : https://github.com/AnnoF/Wraith-Guild
Domaine de production : https://wraith-guild.fr (VPS OVH)

## Repères essentiels (à ne pas deviner à partir du nom des choses)

- **4 rôles site, pas 3** : `CANDIDAT` (par défaut), `RAIDEUR`, `OFFICIER`,
  `ADMINISTRATEUR`. Un `CANDIDAT` est un compte Discord connecté mais pas
  encore membre de la guilde — voir [Candidatures](#candidatures--recrutement)
  plus bas. Ne pas oublier ce rôle : il concerne tout compte qui vient de se
  connecter pour la première fois.
- **Noms de rôles Discord actuels** : `Raideur` et `Officier` (voir
  `.env.example` / `DISCORD_ROLE_RAIDEUR` / `DISCORD_ROLE_OFFICIER`). Ne pas
  supposer `Member` / `Officers` ou tout autre nom — toujours vérifier
  `.env` / `.env.example` plutôt que de deviner, ces noms peuvent changer.
- **Toujours vérifier les droits dans les routes API et les pages
  serveur**, avec les helpers de `src/lib/auth.ts` :
  `canConfigureRaids(role)` (Officier+), `canManageRoles(role)`
  (Administrateur), `isMember(role)` (connecté et pas Candidat). Ne jamais
  réimplémenter cette logique inline — voir [Recettes](#recettes-courantes).
- **Versions réelles** (toujours vérifier `package.json`) : Next.js
  `^16.2.12` (App Router), React `^19.2.8`, NextAuth `^4.24.15`, Prisma
  `^5.20.0`, TypeScript `^5.5.3`, Vitest `^4.1.10`, Playwright `^1.62.1`,
  PM2 en prod.
- **Avant de conclure une modification de code** : lancer
  `npm run type-check` puis `npm test` (rapide, sans base de données). Ce
  sont les deux commandes que la CI fait tourner sur chaque PR. **Il n'y a
  pas de `npm run lint`** : le script a été retiré, `next lint` n'existe
  plus en Next.js 16 et aucun ESLint n'est installé — ne pas le proposer.
- **Un merge sur `main` déploie automatiquement en production** via GitHub
  Actions (`.github/workflows/ci-cd.yml`), `prisma db push` compris. Ce
  n'est plus un déploiement manuel — voir [CI/CD](#cicd-github-actions)
  avant de toucher au schéma ou au workflow.
- **Pas de `prisma/migrations` versionné** : le schéma est appliqué avec
  `npx prisma db push`, en local comme en prod. Ne jamais lancer
  `prisma migrate dev/deploy` sans en discuter avec l'utilisateur d'abord
  (ça initialiserait un historique de migrations qui n'existe pas encore).
- **Les tests E2E ne tournent jamais contre la base de production** : ils
  vident les tables avant chaque run. Ils utilisent la base dédiée
  `wraithguild_test` et ne tournent pas en CI — voir [Tests](#tests).
- **UI en français, code/identifiants en anglais** : les libellés affichés
  et les commentaires sont en français ; les noms de variables, fonctions,
  routes et enums Prisma sont en anglais (sauf les enums `WowClass` et
  `SiteRole` qui sont volontairement en français, ex. `PRETRE`, `RAIDEUR`).
  Rester cohérent avec ce mélange en modifiant du code existant.

## Concept fonctionnel

### Rôles du site (4 niveaux)
| Rôle | Accès |
|---|---|
| `CANDIDAT` | rôle par défaut à la première connexion Discord si pas encore membre ; cantonné à `/candidature` (garde-fou dans `src/app/(app)/layout.tsx`) |
| `RAIDEUR` | + créer des personnages, s'inscrire aux raids ouverts |
| `OFFICIER` | + configurer les raids, gérer les compositions, `/candidatures`, `/membres`, `/presence`, `/guide`, `/hall-of-fame` |
| `ADMINISTRATEUR` | + attribuer/changer les rôles des autres utilisateurs (`/admin`) |

Ces rôles sont stockés en base (`User.siteRole`), gérés manuellement une
fois l'utilisateur créé — ils ne sont **pas** re-synchronisés automatiquement
à chaque connexion depuis Discord (seule la création initiale du compte fixe
le rôle par défaut), pour éviter qu'un décalage de synchro ou un bot en
panne ne retire les droits de quelqu'un par erreur. L'historique des
changements de rôle est tracé dans le modèle `RoleAudit`.

### Connexion / contrôle d'accès Discord
La connexion se fait uniquement via Discord OAuth (`src/lib/auth.ts`). **Tout
compte Discord peut se connecter** (ce n'est plus filtré à la connexion) :
un bot Discord (intent "Server Members", `src/lib/discord.ts`) vérifie si le
membre possède le rôle Discord `DISCORD_ROLE_RAIDEUR` ou
`DISCORD_ROLE_OFFICIER` (valeurs actuelles : `Raideur` / `Officier`, voir
`.env.example`) ; si oui, le rôle site correspondant est attribué à la
création du compte, sinon le compte reste `CANDIDAT` et est redirigé vers
`/candidature`. Seule une vraie erreur d'appel à l'API Discord bloque la
connexion elle-même.

⚠️ Les noms de rôles Discord sont sensibles à la casse. Si la guilde renomme
ses rôles Discord, mettre à jour `DISCORD_ROLE_RAIDEUR` /
`DISCORD_ROLE_OFFICIER` dans le `.env` de production (pas dans le code).

### Candidatures / recrutement
Un compte `CANDIDAT` dépose une candidature depuis `/candidature`
(formulaire public, hors du groupe `(app)`, voir `CandidatureForm.tsx` et
`src/lib/applicationInfo.ts` pour le texte de présentation). Modèle
`Application` : classe/spé/race/niveau, métiers, expérience, objectifs,
disponibilités, etc. Les Officiers consultent et traitent les candidatures
depuis `/candidatures` (liste) et `/candidatures/[id]` (détail), peuvent
échanger des commentaires (`ApplicationComment`, visibilité `INTERNE` —
jamais vu du candidat — ou `PARTAGE` — visible et éditable par le candidat).
Deux canaux de notification best-effort (n'échouent jamais bruyamment) :
- Webhook Discord de salon (`DISCORD_APPLICATIONS_WEBHOOK_URL`,
  `src/lib/discordWebhook.ts`) à la création d'une candidature ou d'un
  nouveau message d'échange.
- DM Discord direct au candidat (`sendDirectMessage` dans
  `src/lib/discord.ts`) quand un Officier lui répond — échoue silencieusement
  si le candidat n'a pas encore rejoint le serveur Discord.

Accepter une candidature ne change pas automatiquement le `siteRole` : ça
reste une action manuelle d'un Administrateur/Officier une fois la personne
invitée sur le Discord de guilde et son rôle Discord attribué.

### Personnages
Un utilisateur peut créer plusieurs personnages : nom, classe (parmi Prêtre,
Mage, Démoniste, Druide, Voleur, Chasseur, Chaman, Guerrier, Paladin —
`WowClass`), et une spécialisation dépendante de la classe (mapping dans
`src/lib/classes.ts`, qui déduit aussi le rôle de raid probable — tank/heal/
dps — via `guessRaidRole`). Un personnage peut avoir jusqu'à **2 métiers**
(`CharacterProfession`, limite appliquée côté application dans
`POST /api/characters`, pas en base) et être marqué `canRaidLead` (le joueur
se déclare capable de RL ce perso). Les personnages ne sont jamais supprimés
en dur, seulement archivés (`isActive: false`) pour ne pas casser
l'historique des raids passés.

### Raids
Un événement de raid regroupe une ou plusieurs **instances** figées dans
`src/lib/raidInstances.ts` (`RAID_INSTANCE_SIZES` — Barrow Deeps = 10,
Hyjal Summit = 20, Onyxia's Lair = 40). La taille n'est plus un champ libre : plusieurs instances
peuvent être programmées le même soir (`Raid.titles: String[]`) mais
uniquement si elles partagent la même taille (`instancesShareSize`). Une
seule composition/liste d'inscrits sert pour tout l'événement. Statuts :
`OUVERT`, `FERME`, `TERMINE`, `ANNULE`. Un raid `OUVERT` dont la
`signupDeadline` est dépassée s'affiche comme `FERME`, et un raid dont la
`date` est passée s'affiche comme `TERMINE`, sans qu'un Officier ait besoin
de changer le statut en base — c'est calculé à l'affichage
(`effectiveRaidStatus` dans `src/lib/raidStatus.ts`), le statut réel en base
ne change que sur action explicite d'un Officier. Le "mode avancé" de la
composition permet d'assigner un rôle par boss (ex: Off Tank 2 sur Garr),
défini par titre de raid dans `src/lib/bossRoles.ts` (`RAID_BOSS_ROLES`) ;
un raid sans entrée dans ce fichier n'a pas de mode avancé disponible.

### Inscriptions
Un joueur s'inscrit lui-même (disponibilité) ; le personnage n'est assigné
qu'ensuite par un Officier dans le constructeur de composition
(`/officier/raids/[id]/composition`). Statuts possibles : `INSCRIT`,
`RESERVE` (bench), `ABSENT`, `DESISTE`. Une fois placé, `RaidSignup.slot`
donne la position dans la grille (0 à size-1).

### Présence et mode vacances
- `/presence` (Officier+) calcule un taux de présence par membre sur tous
  les raids passés (présent = inscrit+placé ou en réserve ; absent = statut
  `ABSENT` ; déserteur = pas inscrit ou `DESISTE`), voir `GET /api/presence`.
- Un utilisateur peut définir une période de vacances (`User.vacationStart`/
  `vacationEnd`, page `VacationMode`). `src/lib/vacation.ts` bascule alors
  automatiquement ses inscriptions en `ABSENT` sur les raids concernés — au
  moment où il définit ses dates, et au moment où un raid est créé dans
  cette période. C'est ponctuel (pas réappliqué en continu) : l'utilisateur
  peut ensuite changer son statut manuellement.
- `src/lib/wowWeek.ts` calcule la semaine WoW (reset le mercredi), utilisée
  pour verrouiller l'inscription en double d'un même personnage sur un raid
  la même semaine (`WeekLockBadge`).

## Structure du code

```
src/
  app/
    page.tsx                          accueil publique + connexion Discord
    layout.tsx / providers.tsx        layout racine + providers (SessionProvider…)
    globals.css                       tokens CSS (couleurs, polices), voir Design
    candidature/                      page + formulaire PUBLICS de candidature
      page.tsx, CandidatureForm.tsx     (hors du groupe (app) — un CANDIDAT y est redirigé)
    galerie/page.tsx                  médiathèque publique (captures + clips Twitch)
    (app)/                            groupe de routes protégées, voir layout.tsx
      layout.tsx                        redirige si pas de session, ou si siteRole = CANDIDAT
      dashboard/
        page.tsx                        tableau de bord perso
        personnages/                    onglet "Mes personnages"
        raids-a-venir/                  onglet "Raids à venir"
        raids-passes/                   onglet "Raids passés"
      raids/[id]/page.tsx               détail d'un raid + inscription
      officier/raids/                   liste (Officier+)
        nouveau/                        création d'un raid (Officier+)
        [id]/composition/               constructeur de composition (Officier+)
      candidatures/                     liste (Officier+)
        [id]/                           détail + échange avec le candidat (Officier+)
      membres/page.tsx                  annuaire des membres + persos (Officier+)
      presence/page.tsx                 stats de présence (Officier+)
      guide/page.tsx                    guide de raid (boss, vidéos, notes)
      hall-of-fame/page.tsx             Hall of Fame (lecture tous, édition Officier+)
      admin/page.tsx                    gestion des rôles (Administrateur)
    api/
      auth/[...nextauth]/route.ts       NextAuth (Discord)
      characters/, characters/[id]/     CRUD personnages
      raids/, raids/[id]/               CRUD raids
      raids/[id]/signup/                inscription d'un joueur
      raids/[id]/boss-roles/            assignations du mode avancé
      applications/, applications/me/   candidatures (liste Officier / la mienne)
      applications/[id]/                détail + statut d'une candidature
      applications/[id]/comments/       échange candidat ↔ officiers
      admin/users/, .../[id]/role/      gestion des rôles (Administrateur)
      members/, members/[id]/           annuaire (Officier+)
      presence/                         stats de présence (Officier+)
      guide/, guide/[id]/               guide de raid (Officier+ en écriture)
      hall-of-fame/, .../upload/, .../[id]/  Hall of Fame + upload d'image
      me/                               profil courant (dont mode vacances)
      guild-progress/, .../[id]/        progression de guilde affichée sur la vitrine (Administrateur en écriture)
      recruitment/                      état du recrutement affiché sur la vitrine (Officier+ en écriture)
  components/   Navbar, PublicNavbar, Footer, SignInButton, SignOutLink,
                CharacterForm, CharacterCard, ClassSpecIcon, EnchantBadge,
                RaidCard, RaidLeadBadge, WeekLockBadge, VacationMode,
                GuildShowcase, GuildProgressEditor, RecruitmentEditor, HeroBanner,
                FloatingActionBar, LightboxImage, TwitchClips,
                TwitchStreamEmbed
  lib/
    auth.ts            config NextAuth + vérif rôle Discord au 1er login +
                        helpers canConfigureRaids / canManageRoles / isMember
    discord.ts          appels API Discord (bot) : membre, rôles, DM
    discordWebhook.ts    alertes webhook candidatures (DISCORD_APPLICATIONS_WEBHOOK_URL)
    raidNotify.ts        alerte webhook fermeture d'un raid (DISCORD_RAID_WEBHOOK_URL)
    classes.ts           classe → spécialisations → couleur/icône/rôle de raid
    professions.ts       liste des métiers + libellés
    raidInstances.ts     tailles fixes par instance + règle "même taille le même soir"
    bossRoles.ts          rôles par boss pour le mode avancé de composition
    raidGroups.ts         mise en page de la grille de composition (groupes de 5)
    raidStatus.ts         statut affiché calculé (deadline / date dépassée)
    vacation.ts            bascule auto en ABSENT pendant les vacances
    wowWeek.ts             calcul de la semaine WoW (reset mercredi)
    recruitment.ts         lecture/amorçage de l'état du recrutement par spécialisation (RecruitmentStatus), éditable par Officier+ depuis GuildShowcase
    applicationInfo.ts     texte de présentation de la page /candidature
    aboutInfo.ts             texte "Qui sommes-nous ?" affiché dans HeroBanner
    guildInfo.ts            contenu éditorial vitrine (lien Discord)
    guildProgress.ts        lecture/amorçage de la progression de guilde (GuildProgressEntry), éditable par un Administrateur depuis GuildShowcase
    gallery.ts / twitchClips.ts / twitchChannels.ts / youtube.ts
                            listes de contenu pour /galerie et la vitrine
    uploads.ts              sauvegarde/suppression d'images uploadées (public/uploads, hors git)
    url.ts                  helpers d'URL
    prisma.ts               client Prisma partagé
    *.test.ts               tests unitaires Vitest, à côté du fichier testé
prisma/schema.prisma   modèle de données complet, voir ci-dessous
e2e/                   tests Playwright, voir e2e/README.md et la section Tests
  fixtures.ts            fixture `signInAs` (crée un user + pose son cookie)
  global-setup.ts        vide la base de test avant le run
  helpers/db.ts          client Prisma de test, resetDb, createUser
  helpers/session.ts     signe un cookie de session NextAuth sans passer par Discord
  tests/*.spec.ts        un fichier par parcours (auth, personnages, raid, candidature, admin)
.github/workflows/ci-cd.yml   CI (type-check, tests unitaires, build) + déploiement auto
vitest.config.mts      config Vitest (environnement node, alias `@` → src/)
playwright.config.ts   config Playwright (série, webServer `npm run dev`, lit .env.test)
```

### Modèles de données (Prisma)
| Modèle | Rôle |
|---|---|
| `User` | compte, `siteRole`, archivage, dates de vacances |
| `Character` | personnage d'un `User`, classe/spé, métiers, `canRaidLead` |
| `CharacterProfession` | métier d'un personnage (max 2, appliqué côté app) |
| `Raid` | événement de raid (une ou plusieurs instances de même taille) |
| `RaidSignup` | inscription d'un `User` (+ personnage + slot une fois placé) |
| `BossRoleAssignment` | assignation mode avancé (perso → rôle sur un boss) |
| `Application` | candidature de recrutement d'un `User` |
| `ApplicationComment` | échange sur une candidature (`INTERNE`/`PARTAGE`) |
| `GuideEntry` | entrée du guide de raid (un boss = une entrée) |
| `HallOfFameEntry` | souvenir marquant de la guilde |
| `GuildProgressEntry` | ligne de progression affichée sur la vitrine (instance, tués/total), éditable par un Administrateur |
| `RecruitmentStatus` | niveau de priorité de recrutement par spécialisation (classe + spé), affiché sur la vitrine, éditable par Officier+ |
| `RoleAudit` | historique des changements de `siteRole` |

## Tests

Deux niveaux, avec des contraintes très différentes — ne pas les confondre.

### Tests unitaires (Vitest) — `npm test`
Rapides, sans base de données ni réseau, lancés par la CI sur chaque PR.
Les fichiers vivent **à côté du code testé** (`src/lib/classes.test.ts` pour
`src/lib/classes.ts`) ; `vitest.config.mts` ne ramasse que
`src/**/*.test.ts`, en environnement `node`, avec l'alias `@` → `src/`.

Ils couvrent aujourd'hui les modules purs de `src/lib/` (classes, raids,
statuts, semaine WoW, recrutement, URL…). Le fuseau est forcé à
`Europe/Paris` via `cross-env` dans le script npm : ne pas retirer ce
préfixe, plusieurs tests de dates en dépendent.

`npm run test:watch` pour le mode interactif.

### Tests E2E (Playwright) — `npm run test:e2e`
Vrai navigateur, vrai serveur Next.js, vraie base Postgres. Couvrent les
parcours critiques : accès par rôle, personnages, inscription à un raid,
composition, candidature, admin.

⚠️ **Trois points à connaître avant d'y toucher** :
1. Ils tournent contre la base **`wraithguild_test`**, jamais `wraithguild`
   (la prod) : `e2e/global-setup.ts` fait un `TRUNCATE` de toutes les tables
   avant chaque run. Une mauvaise `DATABASE_URL` dans `.env.test` effacerait
   de vraies données de guilde.
2. Il n'y a pas de Postgres sur le poste de travail : la base de test est
   sur le VPS, atteinte par un **tunnel SSH à garder ouvert** pendant le run
   (`ssh -L 5432:localhost:5432 <user>@51.210.247.13 -N`). Sans tunnel, les
   tests échouent à la connexion — ce n'est pas un bug du code testé.
3. **Ils ne tournent pas en CI** (ils auraient besoin de ce tunnel et de
   secrets de base) : c'est une commande à lancer manuellement, en local.

La procédure complète (création de la base, `.env.test`, `db push` sur la
base de test) est dans **`e2e/README.md`** — s'y référer plutôt que de la
réinventer.

Le flux OAuth Discord n'est pas automatisable : `e2e/helpers/session.ts`
signe directement un cookie de session NextAuth. Aucun code de
`src/lib/auth.ts` n'est modifié ni contourné pour les tests.

## Recettes courantes

**Écrire un test** : d'abord se demander lequel des deux niveaux convient.
Une fonction pure de `src/lib/` → test unitaire à côté d'elle, c'est
toujours le choix par défaut (rapide, tourne en CI). Un parcours qui
traverse plusieurs pages, la base et les droits → test E2E dans
`e2e/tests/<parcours>.spec.ts`, en important `test`/`expect` depuis
`../fixtures` (jamais depuis `@playwright/test` directement, sinon la
fixture `signInAs` n'existe pas) :

```ts
import { test, expect } from "../fixtures";

test("un RAIDEUR crée un personnage", async ({ page, signInAs }) => {
  await signInAs("RAIDEUR");
  await page.goto("/dashboard/personnages");
  // ...
});
```

Chaque test crée ses propres données (`signInAs` + `prisma` réexporté par
`../fixtures`) : pas de fixture partagée mutable entre specs, la suite
tourne en série et doit rester indépendante de l'ordre d'exécution.

**Nouvelle page protégée (Raideur+)** : la créer sous
`src/app/(app)/...` — le layout `src/app/(app)/layout.tsx` gère déjà la
redirection si pas connecté ou si `CANDIDAT`. Pour restreindre à Officier+
ou Administrateur, vérifier `session.user.siteRole` avec
`canConfigureRaids`/`canManageRoles` en haut du composant serveur (voir
`src/app/(app)/admin/page.tsx` pour le pattern) et rediriger/afficher un
message sinon — ne pas se fier uniquement au menu de la Navbar qui ne fait
que masquer le lien.

**Nouvelle route API protégée** : suivre le pattern de
`src/app/api/members/route.ts` / `src/app/api/presence/route.ts` :
`getServerSession(authOptions)` → 401 si pas de session → helper de
`src/lib/auth.ts` (`canConfigureRaids`/`canManageRoles`/`isMember`) → 403 si
insuffisant. Toujours faire ce contrôle serveur, jamais uniquement côté
client.

**Nouvelle instance de raid** : ajouter une entrée dans
`RAID_INSTANCE_SIZES` (`src/lib/raidInstances.ts`) avec sa taille fixe ; si
elle a des boss avec des rôles dédiés en mode avancé, ajouter une entrée
correspondante dans `RAID_BOSS_ROLES` (`src/lib/bossRoles.ts`).

**Notification Discord best-effort** : suivre le pattern de
`discordWebhook.ts`/`raidNotify.ts` — lire l'URL du webhook depuis `.env`,
`return` silencieusement si absente, `try/catch` avec `console.error` sans
jamais laisser une erreur de notification faire échouer l'action principale
(création, changement de statut...).

**Upload d'image** : utiliser `saveUploadedImage`/`deleteUploadedImage` de
`src/lib/uploads.ts` (jpg/png/webp/gif, 8 Mo max, écrit dans
`public/uploads/<subdir>/`, hors git). Ne pas réimplémenter la validation de
type/taille ailleurs.

**Ajout de champ au schéma Prisma** : demander d'abord si on garde
`db push` (rapide, cohérent avec l'existant) ou si c'est le moment de
démarrer un historique `prisma migrate` — ne pas trancher seul. Prévenir
aussi que le merge sur `main` appliquera le changement en production
automatiquement (voir [Point d'attention Prisma](#point-dattention-prisma)).

## Design — identité visuelle

Direction validée le 2026-09-15 : **haute fantaisie / tome ancien**,
inspirée explicitement de la page officielle
https://worldofwarcraft.blizzard.com/fr-fr/forever (bleu/teal profond, or
en accent principal, filigranes). C'est un second revirement : le thème
précédent était sombre façon "Horde" (rouge sang, formes anguleuses/
biseautées, camp de guerre), qui avait lui-même remplacé un tout premier
essai parchemin/or abandonné. Ne pas "corriger" vers le style sombre/
anguleux — cette direction dorée/ornementée est désormais celle à conserver.

- Palette (variables CSS dans `src/app/globals.css`, dupliquées dans
  `tailwind.config.ts`) : `--void #0B1E22` (fond, bleu-teal profond),
  `--char #122A2E` (cartes), `--gold #D4AF37` (accent principal — anciennement
  `--blood`, renommé car ce n'est plus une couleur rouge), `--bone #F1E6C9`
  (texte, crème chaud), `--amber #B8863B` (accent secondaire / statut
  "FERME"), `--moss #7A9B5C` (statut "OUVERT", inchangé), `--garnet #8B2E2E`
  (rouge dédié aux statuts "danger" : erreurs de formulaire, actions
  destructives/annulation, candidature "Refusée", raid "Annulé", priorité de
  recrutement "Bas", colonne "Déserteur" — bien distinct de l'accent `--gold`
  qui lui reste réservé aux actions primaires/positives). Classe utilitaire
  `.gold-gradient-text` pour les titres en dégradé doré (voir `--gold-light`/
  `--gold-dark`).
- Typographie : classe utilitaire `.font-display` (**Cinzel**, serif
  capitale gravée) pour les titres/UI forte, `.font-ui` (**EB Garamond**,
  serif de lecture) pour le texte courant — chargées via `next/font/google`
  dans `src/app/layout.tsx` (remplace Rajdhani/Barlow Condensed).
- Coins arrondis plutôt qu'angulaires (inversion du précédent "formes
  anguleuses") : boutons/CTA et badges de statut/rôle en pilule
  (`rounded-full`), cartes/champs de formulaire en coin adouci
  (`rounded-sm`). Le cadre doré des cartes est la classe `.gilt-frame`
  (`globals.css`, ex-`.war-border`) : bordure fine dorée + liseré supérieur
  marqué + petits coins ornementaux en pseudo-éléments. Le sceau de rôle en
  biseau (`clip-path` polygon) a été retiré au profit d'un badge pilule.
- `src/components/Ornaments.tsx` fournit deux petits SVG originaux (pas
  d'assets Blizzard) pour l'ambiance "tome ancien" : `GoldRule` (filet
  doré sous les titres de section, utilisé par `SectionTitle` dans
  `GuildShowcase.tsx` et par `HeroBanner.tsx`) et `CornerFlourish` (volute
  décorative dans les coins des bandes plein écran, voir `FullBleedBand`
  dans `GuildShowcase.tsx`).
- `globals.css` pose `html { font-size: 120% }` : toutes les tailles Tailwind
  (`text-sm`, `text-4xl`…) sont donc agrandies de 20% par rapport au défaut.
  Choisir les tailles en regardant le rendu, pas l'échelle Tailwind
  habituelle — et ne pas « corriger » ce 120%, c'est un choix validé.
- Accessibilité déjà en place, à réutiliser plutôt qu'à réinventer : classe
  `.focus-ring` sur les éléments cliquables (contour doré au clavier
  uniquement, `:focus-visible`), et un bloc
  `@media (prefers-reduced-motion: reduce)` qui coupe animations/transitions
- Pour qu'une section de la vitrine déborde du conteneur `max-w-5xl` du
  parent (bande plein écran), reprendre la technique déjà utilisée dans
  `HeroBanner.tsx`/`GuildShowcase.tsx` :
  `relative left-1/2 w-screen -translate-x-1/2`
- Attention copyright : ne jamais reproduire les assets/logo officiels de
  Blizzard (artwork, emblèmes), seulement s'inspirer de la palette/l'ambiance
  de la page WoW: Forever
- **Vitrine publique** (`/`, voir `HeroBanner.tsx` et `GuildShowcase.tsx`) :
  fond vidéo en tête de page (`public/video/hero.mp4`), sections regroupées
  en bandes plein écran avec image de fond dégradée vers le fond teal
  (`public/vitrine/*.jpg` — recrutement, raids/progression, streams), et
  barre d'actions persistante en bas d'écran (`FloatingActionBar.tsx`,
  réductible/masquable). Ces fonds/vidéo sont spécifiques à la vitrine ; le
  reste du site garde un fond sobre (`--void` uni).

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
DISCORD_ROLE_RAIDEUR=Raideur
DISCORD_ROLE_OFFICIER=Officier
DISCORD_APPLICATIONS_WEBHOOK_URL   # optionnel : alertes salon Discord sur les candidatures
DISCORD_RAID_WEBHOOK_URL           # optionnel : alerte salon Discord à la fermeture d'un raid
```
Les valeurs réelles existent uniquement dans le `.env` sur le VPS (et
localement si besoin de tester) — ne jamais les redemander à l'utilisateur
pour les mettre dans un fichier versionné, ne jamais les committer. Les deux
variables webhook sont optionnelles : leur absence désactive silencieusement
la notification correspondante, sans erreur.

### Point d'attention Prisma
Il n'existe pas encore de dossier `prisma/migrations` versionné : la base de
prod a été initialisée avec `npx prisma db push`, pas `migrate deploy`. Si un
changement de schéma est nécessaire, décider avec l'utilisateur s'il veut
initialiser un vrai historique de migrations (`prisma migrate dev` en local
puis `migrate deploy` en prod) plutôt que de continuer au `db push`.

Depuis la mise en place du CI/CD, `prisma db push` sur la base de prod est
lancé **automatiquement** par `deploy.sh` à chaque merge sur `main` : un
changement de schéma est donc appliqué en production sans intervention. Ne
pas oublier que `db push` peut supprimer des colonnes/données sans
avertissement — un renommage de champ est une suppression + un ajout.

La base de test E2E (`wraithguild_test`) n'est mise à jour par personne
automatiquement : après un changement de schéma, y appliquer `db push` à la
main avant de relancer les tests E2E (voir `e2e/README.md`).

### CI/CD (GitHub Actions)
Le déploiement n'est plus manuel. `.github/workflows/ci-cd.yml` définit deux
jobs :

- **`ci`** — sur chaque PR vers `main` *et* sur chaque push sur `main` :
  `npm ci`, `prisma generate`, `npm run type-check`, `npm test`,
  `npm run build`. Pas de step de lint (voir
  [Repères essentiels](#repères-essentiels-à-ne-pas-deviner-à-partir-du-nom-des-choses)),
  et pas de tests E2E (voir [Tests](#tests)).
- **`deploy`** — uniquement sur push sur `main`, après un `ci` vert :
  connexion SSH au VPS avec les secrets GitHub `DEPLOY_HOST`, `DEPLOY_USER`,
  `DEPLOY_SSH_KEY` (environnement `production`, `concurrency` sur
  `deploy-production` pour éviter deux déploiements simultanés).

La clé SSH de déploiement est **restreinte côté serveur** : dans
`authorized_keys`, une directive `command=` force l'exécution de
`/var/www/Wraith-Guild/deploy.sh` et ignore la commande envoyée par le
workflow. Ce script n'est pas versionné dans le dépôt (il vit sur le VPS) et
enchaîne `git pull`, `npm ci`, `prisma generate`, `prisma db push`,
`npm run build`, `pm2 restart wraith-guild`.

Conséquences pratiques :
- **Un merge sur `main` part en prod tout seul**, migration de schéma
  comprise (`db push` est dans le script). Ne pas merger un changement de
  schéma sans être prêt à le voir appliqué en production.
- Modifier les étapes du déploiement demande d'éditer `deploy.sh` **sur le
  VPS**, pas le workflow — le workflow ne fait qu'ouvrir la connexion.
- Le déploiement manuel reste possible en secours (se connecter au VPS et
  lancer `deploy.sh`), mais ce n'est plus le chemin normal.

## État d'avancement

Le site est **déployé et fonctionnel en production** (auth Discord testée
avec succès, thème Horde en ligne). Le périmètre a beaucoup grandi depuis le
MVP initial (raids/personnages) : recrutement par candidature, annuaire des
membres, stats de présence, mode vacances, guide de raid, Hall of Fame,
médiathèque/Twitch. L'outillage a suivi : refonte de la vitrine publique
d'après une maquette, pipeline CI/CD avec déploiement automatique, tests
unitaires Vitest et suite E2E Playwright sur les parcours critiques.
L'utilisateur prévoit de nombreux changements à venir —
rien de figé, itérer librement sur les pages/fonctionnalités existantes
selon ses demandes. **Si le code observé contredit ce fichier, faire
confiance au code** et signaler l'écart plutôt que de le reproduire
silencieusement.
