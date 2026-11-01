import "dotenv/config";
import { defineConfig } from "prisma/config";

// Depuis Prisma 7, l'URL de la base ne vit plus dans schema.prisma et le .env
// n'est plus chargé automatiquement : on l'importe ici pour la CLI
// (db push, generate…). L'application, elle, passe par l'adaptateur pg
// (voir src/lib/prisma.ts).
//
// Pas de env("DATABASE_URL") : il lève une erreur si la variable est absente,
// ce qui casserait `prisma generate` en CI (pas de base sur GitHub Actions) et
// après un `npm install` sans .env. `generate` n'a pas besoin de la base ;
// `db push` sans variable échoue de toute façon avec une erreur de connexion.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? ""
  }
});
