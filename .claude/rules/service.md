---
paths:
  - "src/services/**"
---

# Couche service

- Porte toutes les règles métier de `INTENT.md` : nettoyage du nom, unicité, bornes des
  nombres, tri, recherche, filtres.
- Une seule fonction de normalisation (casse, accents, espaces), utilisée par le tri, la
  recherche et l'unicité. Jamais de seconde implémentation.
- Fonctions pures, sans effet de bord : pas d'horloge, d'aléatoire, ni de génération d'id
  (ils sont passés en paramètre).
- Une saisie refusée renvoie une erreur typée avec un message en français que la présentation
  affiche telle quelle.
- Définit `GameRepository`. N'importe jamais `src/data`, `@libsql/*`, React, Next ni
  `src/components`.
- Tests d'abord : écrire le test, le voir échouer, puis écrire le code. `x.ts` a son
  `x.test.ts` à côté.
- Un test par règle de `INTENT.md`, cas limites compris : bornes (0, 1), `min = max`,
  `min > max`, accents et majuscules, doublons, filtre actif qui masque les jeux sans information.

## Comment vérifier

- `pnpm test` passe.
- `pnpm lint` : bloque les imports interdits et `Date.now`, `new Date`, `Math.random`,
  `randomUUID` dans `src/services` (hors tests).
- Aucun fichier sans test (doit ne rien afficher) :
  `for f in src/services/*.ts; do case $f in *.test.ts) ;; *) [ -f "${f%.ts}.test.ts" ] || echo "sans test: $f";; esac; done`
- Le test a échoué avant le code : le dire dans la réponse ou le message de commit. Seule la
  relecture le contrôle.
