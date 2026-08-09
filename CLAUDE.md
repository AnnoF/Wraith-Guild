# Wraith-Guild — Contexte du projet

Site de gestion de guilde pour **Camelote**, un futur opus de World of
Warcraft basé sur WoW Classic/Vanilla (aucune information officielle sur le
jeu pour l'instant — sortie prévue dans quelques mois). Le site gère les
candidatures de recrutement, les personnages, les inscriptions et les
compositions de raid de la guilde.

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
- **Versions réelles** (voir `package.json`, pas le README qui est
  optimiste) : Next.js `^16.2.12` (App Router), React `^19.2.8`, NextAuth
  `^4.24.15`, Prisma `^5.20.0`, TypeScript `^5.5.3`, PM2 en prod.
- **Pas de `prisma/migrations` versionné** : le schéma est appliqué avec
  `npx prisma db push`, en local comme en prod. Ne jamais lancer
  `prisma migrate dev/deploy` sans en discuter avec l'utilisateur d'abord
  (ça initialiserait un historique de migrations qui n'existe pas encore).
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
`src/lib/raidInstances.ts` (`RAID_INSTANCE_SIZES` — ex. Molten Core = 40,
Zul'Gurub = 20). La taille n'est plus un champ libre : plusieurs instances
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
    recruitment.ts         lecture/amorçage de l'état du recrutement par classe (RecruitmentStatus), éditable par Officier+ depuis GuildShowcase
    applicationInfo.ts     texte de présentation de la page /candidature
    aboutInfo.ts             texte "Qui sommes-nous ?" affiché dans HeroBanner
    guildInfo.ts            contenu éditorial vitrine (lien Discord)
    guildProgress.ts        lecture/amorçage de la progression de guilde (GuildProgressEntry), éditable par un Administrateur depuis GuildShowcase
    gallery.ts / twitchClips.ts / twitchChannels.ts / youtube.ts
                            listes de contenu pour /galerie et la vitrine
    uploads.ts              sauvegarde/suppression d'images uploadées (public/uploads, hors git)
    url.ts                  helpers d'URL
    prisma.ts               client Prisma partagé
prisma/schema.prisma   modèle de données complet, voir ci-dessous
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
| `RecruitmentStatus` | niveau de priorité de recrutement par classe, affiché sur la vitrine, éditable par Officier+ |
| `RoleAudit` | historique des changements de `siteRole` |

## Recettes courantes

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
démarrer un historique `prisma migrate` — ne pas trancher seul (voir
[Point d'attention Prisma](#point-dattention-prisma)).

## Design — identité visuelle

Direction validée : **inspirée de la Horde**, pas médiévale/parchemin (une
première direction parchemin/or a été essayée puis abandonnée).

- Palette (variables CSS dans `src/app/globals.css`) : `--void #0D0B0A`
  (fond), `--char #161210` (cartes), `--blood #A61B1B` (accent unique),
  `--bone #EDE7E0` (texte), `--amber #C98A2C` et `--moss #7A9B5C` (réservées
  aux badges de statut)
- Typographie : classe utilitaire `.font-display` (**Rajdhani**, condensée,
  majuscules) pour les titres/UI forte, `.font-ui` (**Barlow Condensed**)
  pour le texte courant — chargées via `next/font/google` dans
  `src/app/layout.tsx` (remplace Oswald/Inter, changement validé lors de la
  refonte de la vitrine sur la base d'une maquette fournie par l'utilisateur)
- Formes anguleuses plutôt qu'arrondies : bordure gauche épaisse (classe
  `.war-border` dans `globals.css`, toujours utilisée sur les cartes hors
  vitrine), sceau de rôle en biseau (`clip-path` polygon)
- Ne pas réintroduire de courbes/dorures type parchemin médiéval — direction
  tranchée volontairement plus "camp de guerre" que "taverne"
- Attention copyright : ne jamais reproduire l'emblème officiel de la Horde
  (propriété Blizzard), seulement s'inspirer de la palette/l'ambiance
- **Vitrine publique** (`/`, voir `HeroBanner.tsx` et `GuildShowcase.tsx`) :
  fond vidéo en tête de page (`public/video/hero.mp4`), sections regroupées
  en bandes plein écran avec image de fond dégradée vers le noir
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
avec succès, thème Horde en ligne). Le périmètre a beaucoup grandi depuis le
MVP initial (raids/personnages) : recrutement par candidature, annuaire des
membres, stats de présence, mode vacances, guide de raid, Hall of Fame,
médiathèque/Twitch. L'utilisateur prévoit de nombreux changements à venir —
rien de figé, itérer librement sur les pages/fonctionnalités existantes
selon ses demandes. **Si le code observé contredit ce fichier, faire
confiance au code** et signaler l'écart plutôt que de le reproduire
silencieusement.
