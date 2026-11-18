# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Product

`INTENT.md` is the source of truth for what the app must do (personal board-game library: business rules, filters, acceptance criteria, out of scope). Read it before any feature work; it states intent only, technical choices are made here.

## Commands

- `pnpm dev`: dev server (Turbopack) on http://localhost:3000
- `pnpm build`: production build, also type-checks
- `pnpm lint`: ESLint (flat config in `eslint.config.mjs`)

No test runner is set up yet. `INTENT.md` requires business rules and filters to be checked automatically, so one is needed with the first business rule.

## Stack and layout

- Next.js 16 App Router (`app/`), React 19, TypeScript, pnpm.
- `next.config.ts` enables `cacheComponents` and `partialPrefetching`: data fetching follows the Cache Components model (`use cache`, `<Suspense>`), check the bundled docs in `node_modules/next/dist/docs/` before writing data code.
- Tailwind CSS v4: no `tailwind.config`, configured in CSS (`app/globals.css`, `@import "tailwindcss"`) and loaded through the `@tailwindcss/turbopack` loader declared in `next.config.ts`.
- Import alias `@/*` maps to the repo root.

## Git

Work on `dev` (or a branch off it); PRs target `dev`. `main` is the release branch.
