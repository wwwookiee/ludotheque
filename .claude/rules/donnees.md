---
paths:
  - "src/data/**"
---

# Couche données

- Seule couche qui parle à la base (Turso, `@libsql/client`).
- Implémente `GameRepository` (défini dans `src/services`). Stocke et lit, sans règle métier :
  validation, unicité et tri restent au service.
- Requêtes paramétrées uniquement, jamais de SQL concaténé.
- Les erreurs de la base sont converties en erreurs du domaine : rien de libSQL ne remonte.
- Chaque implémentation passe la même suite de tests de contrat, pour que changer de stockage
  ne change rien à l'app. (À écrire avec la deuxième implémentation, Turso.)
- Changer de stockage = une nouvelle implémentation ici + une ligne dans `src/container.ts`.
- Le dépôt mémoire ne sert qu'aux tests et à l'exemple : il ne persiste rien. Tant que
  `container.ts` le branche, le critère « mes jeux sont toujours là après redémarrage » n'est
  pas rempli.
- Les clés et l'URL de la base viennent de `.env.local`, jamais du code.

## Comment vérifier

- `pnpm lint` : bloque `@libsql/*` dans `src/app` et `src/services`.
- Rien hors de `src/data` n'importe la base (doit ne rien afficher) :
  `grep -rn "@libsql" src --include='*.ts' --include='*.tsx' | grep -v '^src/data/'`
- SQL concaténé (doit ne rien afficher, aide à la relecture, pas une garantie) :
  `grep -rnE '\$\{' src/data --include='*.ts' | grep -iE 'select|insert|update|delete'`
- `pnpm test` passe, sur chaque implémentation une fois la suite de contrat écrite.
- Quelle implémentation est branchée : `cat src/container.ts`.
- Aucun secret versionné : `git grep -nE 'authToken|libsql://' -- . ':!.env.example'`
