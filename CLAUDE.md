# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

Ludothèque : bibliothèque personnelle de jeux de plateau. Le besoin, les règles métier, les filtres
et les critères d'acceptation sont dans `INTENT.md`. Le découpage en lots (un lot = une issue
GitHub, critères en Étant donné / quand / alors) est dans `lots.md`.
Les décisions d'architecture sont dans `docs/decisions/` (un ADR par décision) : lis l'ADR concerné
avant de changer une brique.

## Commandes (pnpm)

- `pnpm dev` : serveur local sur `file:local.db` (SQLite).
- `pnpm test` : toute la suite Vitest. Un fichier : `pnpm vitest run src/services/games.test.ts`.
  Un test : `pnpm vitest run src/services/games.test.ts -t "doublon"`.
- `pnpm exec tsc --noEmit` : types (pas de script dédié).
- `pnpm lint` : ESLint, qui fait aussi respecter les couches (voir plus bas).
- `pnpm db:push` : applique le schéma sur Turso et y copie les jeux de `local.db`.
  `pnpm db:push --schema-only` : le schéma seul. Valeurs lues dans `.env.turso`.

Avant de livrer : `pnpm test`, `tsc --noEmit` et `pnpm lint` passent tous les trois.

## Architecture : trois couches, dépendances à sens unique

présentation (`src/app`, `src/components`) → service (`src/services`) → données (`src/data`)

- **Service** (`src/services/games.ts`) : toutes les règles métier. Il valide et convertit la
  saisie brute (du texte), calcule la clé d'unicité (`normalizeKey`, la seule normalisation
  casse/accents/espaces), trie et filtre. Il renvoie des refus typés (règle, message en français,
  champs fautifs) au lieu de lever. Il définit l'interface `GameRepository` et n'importe ni
  `src/data`, ni React, ni Next, ni `@libsql`.
- **Données** (`src/data`) : seule couche qui parle à la base, via `@libsql/client`. Une seule
  implémentation, `libsql-repository.ts`, pour SQLite en local et Turso en ligne. `libsql-migrate.ts`
  crée ou met à niveau le schéma à la première requête, de façon idempotente. Le dépôt garantit
  l'unicité de la clé par un index unique et la convertit en `DuplicateGameError`. Toute
  implémentation passe la suite commune `repository.contract.ts`.
- **Assemblage** (`src/container.ts`) : seul endroit qui choisit le stockage. La présentation
  n'accède aux jeux que par `games` de `@/container`.
- **Présentation** : `page.tsx` lit les filtres dans l'URL (`?q=&status=&players=&duration=`) et
  les passe tels quels à `games.query`. Les écritures passent par les actions serveur de
  `src/app/actions.ts`, qui lisent le `formData` brut, appellent le service et renvoient son
  résultat, sans rien décider. Composants : shadcn (style `base-nova`, sur `@base-ui/react`) dans
  `src/components/ui/`. `/design-system` est la page de référence visuelle.

## Règles du projet

Les règles détaillées sont dans `.claude/rules/` et se chargent selon les fichiers touchés :
`service.md`, `donnees.md`, `validation-serveur.md`, `presentation.md`, `design-system.md`. Chacune
finit par une section « Comment vérifier ». À retenir :

- Service en TDD : écrire le test, le voir échouer, puis coder. `x.ts` a son `x.test.ts` à côté.
- Une nouvelle règle de validation vient avec un test « refusé, et le dépôt n'est pas appelé ».
- Aucune couleur en dur dans `src/app` et `src/components` (hors `ui/`), seulement les jetons du
  thème. Un jeton nouveau est défini en clair ET en sombre dans `globals.css`. Tout écran est
  vérifié dans les deux modes.
- Un composant ajouté dans `ui/` figure sur `/design-system` dans la même modification
  (`design-system.test.ts` le vérifie).
- Requêtes SQL paramétrées et écrites en clair, jamais concaténées.

## Environnements et base

- En local, aucune variable : sans `DATABASE_URL`, l'app utilise `file:local.db`. Ne jamais mettre
  les valeurs Turso dans `.env.local`, sinon l'app locale écrit dans la base en ligne.
- En ligne (Vercel, projet `ludotheque`) : `DATABASE_URL` et `DATABASE_AUTH_TOKEN` dans les
  variables du projet.
- Pour `pnpm db:push` : les mêmes variables dans `.env.turso`, ignoré par git. Le script n'accepte
  que `libsql://` ou `https://`.

## Git

- Le travail se fait sur `dev`, qui est aussi la branche par défaut du repo. Un `Closes #N` ne
  ferme donc l'issue que lorsqu'il arrive sur `dev`, pas lors d'une PR vers `main`.
- La production Vercel suit `main`. Une PR de `dev` vers `main` met en ligne tout ce qui est sur
  `dev`.
- Backlog : issues GitHub. Labels `relecture` (constats de revue) et `bug` (constats de sécurité).
