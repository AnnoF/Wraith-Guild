# Wraith-Guild

Site de gestion de guilde pour Camelote (WoW Classic-like) : inscriptions,
personnages et compositions de raid.

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma + PostgreSQL
- NextAuth (Discord OAuth) avec vérification des rôles Discord via un bot
- Tailwind CSS

## Prérequis

- Node.js 18+
- PostgreSQL (local ou distant)
- Une application Discord (pour l'OAuth et le bot de vérification des rôles)

## Installation locale

```bash
npm install
cp .env.example .env   # puis remplir les valeurs
npx prisma migrate dev --name init
npm run dev
```

## Déploiement (VPS)

```bash
git clone https://github.com/AnnoF/Wraith-Guild.git
cd Wraith-Guild
cp .env.example .env   # remplir avec les vraies valeurs de production
npm install
npx prisma migrate deploy
npm run build
pm2 start npm --name wraith-guild -- start
pm2 save
```

Configurer ensuite Nginx en reverse proxy vers `localhost:3000` et Certbot
pour le certificat SSL (voir la conversation de mise en place pour le détail
des commandes).

## Rôles

- **Raideur** : peut s'inscrire aux raids ouverts avec ses personnages
- **Officier** : peut en plus configurer les raids et gérer les compositions
- **Administrateur** : peut en plus attribuer les rôles Officier

Seuls les membres Discord ayant le rôle "Raideur" ou "Officier" sur le
serveur de guilde peuvent se connecter au site.

## Structure

```
src/
  app/            pages (App Router) + routes API
  components/     composants réutilisables
  lib/            auth, prisma, classes/spécialisations, vérif Discord
prisma/
  schema.prisma   modèle de données
```
