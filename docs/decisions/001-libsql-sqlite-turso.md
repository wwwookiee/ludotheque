# ADR 001 — libSQL : SQLite en local, Turso en ligne

- Status: accepted
- Date: 2026-11-22
- Scope: framing

## Context
Une seule utilisatrice ou un seul utilisateur, quelques centaines de jeux au plus. L'app tourne en
local pendant le développement et en ligne sur Vercel, où le système de fichiers n'est pas persistant.
INTENT.md exige de pouvoir changer de stockage sans que l'app change et sans perdre de jeux.

## Decision
Une seule implémentation du dépôt, `src/data/libsql-repository.ts`, sur `@libsql/client` :
`file:local.db` en local (aucune variable), Turso en ligne (`DATABASE_URL`, `DATABASE_AUTH_TOKEN`).
Le service définit l'interface `GameRepository` ; seul `src/container.ts` choisit le stockage.
L'unicité du nom est garantie par un index unique en base. Le schéma est créé ou mis à niveau
à la première requête (`libsql-migrate.ts`). `pnpm db:push` applique le schéma sur Turso et y copie
les jeux locaux.

## Considered options
- Postgres managé (Neon, Supabase) — rejected because un serveur et un compte de plus, un dialecte SQL
  différent entre local et en ligne, pour une base mono-utilisateur.
- Fichier SQLite seul, sans Turso — rejected because Vercel n'a pas de disque persistant.
- ORM (Drizzle, Prisma) — rejected because une seule table, des requêtes paramétrées écrites en clair suffisent.
- Fichiers JSON — rejected because pas de requêtes ni de contrainte d'unicité côté stockage.

## Consequences
- Même moteur et même SQL en local et en ligne : la suite de contrat `repository.contract.ts` vaut pour les deux.
- Changer de stockage ne touche que `src/data` et `src/container.ts`.
- Les migrations sont écrites à la main et doivent rester idempotentes.
- Ne jamais mettre les valeurs Turso dans `.env.local`, sinon l'app locale écrit dans la base en ligne.
