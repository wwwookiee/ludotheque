---
paths:
  - "src/app/**"
  - "src/components/**"
---

# Couche présentation

- N'appelle que la couche service, via `@/container`. Jamais `@/data` ni `@libsql/*`.
- N'utilise que les composants du design system (`src/components/ui/`) et des classes Tailwind
  sur les jetons shadcn (`bg-card`, `text-muted-foreground`…).
- Aucune couleur en dur : ni hex, `rgb()`, `oklch()`, ni valeur arbitraire (`bg-[#…]`), ni
  couleur de palette Tailwind (`bg-red-500`, `text-white`). Une couleur manque ? On l'ajoute au
  thème dans `globals.css`, en clair ET en sombre.
- Composant serveur par défaut. `"use client"` seulement pour l'interactivité (état, événements).
- Aucune règle métier ici : ni validation, ni tri, ni filtre. Quand le service refuse une saisie,
  afficher son message tel quel et garder la saisie de l'utilisateur.
- Tout écran est vérifié en clair ET en sombre.
- Un composant nouveau ou modifié met aussi à jour `/design-system` (voir `design-system.md`).

## Comment vérifier

- `pnpm lint` : bloque `@/data` et `@libsql/*` dans `src/app`, et toute couleur en dur dans
  `src/app` et `src/components` (hors `ui/`).
- `"use client"` justifié : `grep -rln '"use client"' src/app src/components`, et chaque fichier
  listé a un état ou un événement. Aucune commande ne le prouve, c'est une relecture.
- Ouvrir la page et basculer clair/sombre avec le bouton.
