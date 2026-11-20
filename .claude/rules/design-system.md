---
paths:
  - "src/components/**"
  - "src/app/design-system/**"
  - "src/app/globals.css"
---

# Design system

La route `/design-system` est la référence visuelle. Elle ne doit jamais être en retard sur le code.

- Nouveau composant dans `src/components/ui/` (par exemple après `shadcn add`) : il est ajouté
  à `/design-system` dans la même modification, avec ses variantes et ses états (désactivé,
  erreur, vide, quand ils existent).
- Nouveau composant partagé hors `ui/` (utilisé par plusieurs pages, comme `ThemeToggle`) :
  même obligation. Un composant propre à une seule page n'y figure pas.
- Nouveau jeton de couleur, de police ou de rayon dans `globals.css` : défini en clair ET en
  sombre, et ajouté à la section « Couleurs » ou « Typographie » de la page.
- Composant, variante ou jeton supprimé : retiré de la page.
- La page n'utilise que les composants et les jetons du design system, comme le reste de
  la présentation.

## Comment vérifier

- `pnpm test` : `design-system.test.ts` échoue si un composant de `ui/` n'est pas importé par la
  page, ou si un jeton du thème clair n'existe pas en sombre (`--radius` est commun).
- `pnpm lint` : la page n'a aucune couleur en dur.
- Ouvrir `/design-system` en clair puis en sombre : tout ce qui est nouveau est visible.
- Composants partagés hors `ui/` : relecture, aucune commande ne le prouve.
