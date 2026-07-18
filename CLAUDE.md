# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Wraith-Guild is a guild management site for Camelote (a WoW Classic-like game): character
registration, raid rosters, and raid sign-ups. Next.js 14 (App Router) + TypeScript, Prisma +
PostgreSQL, NextAuth with Discord OAuth, Tailwind CSS.

## Commands

```bash
npm install
cp .env.example .env          # fill in DATABASE_URL, Discord OAuth + bot credentials
npx prisma migrate dev --name init   # apply schema, generates the Prisma client
npm run dev                   # dev server
npm run build                 # production build
npm run lint                  # next lint
npm run prisma:studio         # inspect the DB
```

There is no test suite configured in this repo.

Production deploy (VPS): `git pull`, `npm install`, `npx prisma migrate deploy`, `npm run build`,
then run via `pm2` behind an Nginx reverse proxy (see README).

## Architecture

**Auth is the center of gravity.** Login is gated by Discord guild membership, not just OAuth
success: [src/lib/auth.ts](src/lib/auth.ts)'s `signIn` callback calls
[src/lib/discord.ts](src/lib/discord.ts) to fetch the user's guild member record via a Discord
bot token (`DISCORD_BOT_TOKEN`/`DISCORD_GUILD_ID`), then checks whether they hold the
`DISCORD_ROLE_RAIDEUR` or `DISCORD_ROLE_OFFICIER` Discord role (role names, resolved to Discord
role IDs and cached in-memory for 5 minutes). Users without one of those Discord roles are
rejected at sign-in — no account is created.

On first successful sign-in a `User` row is created with a **site role** (`SiteRole`:
`RAIDEUR` / `OFFICIER` / `ADMINISTRATEUR`) defaulted from their Discord role. This site role is
then managed independently by admins (`/admin`, `PATCH /api/admin/users/[id]/role`) — it does not
re-sync automatically from Discord on later logins, so a user demoted on Discord keeps their site
permissions until an admin changes them. Every role change is written to `RoleAudit` for
traceability (see the transaction in
[src/app/api/admin/users/[id]/role/route.ts](src/app/api/admin/users/[id]/role/route.ts)).

The site role and internal user id are threaded onto the session via the `jwt`/`session`
callbacks in `auth.ts` and typed onto NextAuth's `Session`/`JWT` in
[src/types/next-auth.d.ts](src/types/next-auth.d.ts) (`session.user.id`, `session.user.siteRole`).
Permission checks are two plain predicates in `auth.ts` — `canConfigureRaids` (OFFICIER+) and
`canManageRoles` (ADMINISTRATEUR only) — called at the top of every mutating API route handler
alongside a `getServerSession` check. There's no middleware-based route protection; each
`route.ts` re-checks session + role itself.

**Data model** ([prisma/schema.prisma](prisma/schema.prisma)): `User` → `Character` (1:N, unique
per `(userId, name)`) → `RaidSignup` (join between `Character` and `Raid`, unique per
`(raidId, characterId)`, carries a `SignupStatus`: `INSCRIT` / `RESERVE` (bench) / `ABSENT` /
`DESISTE`). `Raid` has a `RaidStatus` lifecycle (`OUVERT` → `FERME` → `TERMINE`, or `ANNULE`) that
drives which page a raid shows up on (`raids-a-venir` vs `raids-passes`, filtered via the `statut`
query param on `GET /api/raids`).

**WoW class/spec data** ([src/lib/classes.ts](src/lib/classes.ts)) is hand-maintained, not
DB-backed: `WOW_CLASSES`, `CLASS_LABELS`, and `CLASS_SPECS` are the source of truth for what
classes/specs exist and must be kept in sync with the `WowClass` enum in `schema.prisma`.
`guessRaidRole` infers TANK/SOIGNEUR/DPS from a spec name via a flat `SPEC_ROLE` lookup — note
"Protection" maps to TANK even though both Guerrier and Paladin have a spec by that name.

**Route structure**: `src/app/(dashboard)` pages are the raider-facing views (own characters,
upcoming/past raids); `src/app/officier/*` is raid configuration/composition, gated by
`canConfigureRaids`; `src/app/admin` is role management, gated by `canManageRoles`. API routes
under `src/app/api/*` mirror this same three-tier permission structure (session only → Officier+
→ Admin only).
