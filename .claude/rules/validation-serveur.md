---
paths:
  - "src/app/**"
  - "src/services/**"
---

# Validation côté serveur

Tout ce qui vient du client est non fiable, même si le formulaire l'a déjà contrôlé : un
`formData` ou un corps JSON peut être forgé sans passer par l'écran. La validation du serveur
est donc systématique, et elle est la seule qui compte.

- Toute entrée qui écrit (action serveur `"use server"`, route handler, webhook) ne fait que
  trois choses : lire la saisie brute, appeler **une fonction du service** via `@/container`,
  renvoyer son résultat. Aucune écriture ne contourne le service.
- Le service valide tout avant le premier appel au dépôt : type, bornes, valeurs permises
  (statut), nettoyage, unicité. Le dépôt n'est jamais appelé avec une donnée non validée.
  Seules exceptions : la migration de schéma et l'export vers un autre stockage, qui déplacent
  des données déjà validées à leur création. Ils s'écrivent dans `src/data` ou dans un script,
  jamais dans une entrée du client, et ils ne transforment pas la donnée.
- La saisie entre dans le service sous sa forme brute (texte). Le service convertit : un
  nombre n'est pas parsé dans l'action ni dans le composant.
- Aucun `as` ni type TypeScript ne fait passer une saisie du client pour une donnée validée :
  un type n'est pas une validation, il disparaît à l'exécution.
- Une saisie invalide ne lève pas d'exception : le service renvoie une erreur typée (règle,
  message en français, champs fautifs). Seule une panne (base, réseau) lève.
- La validation du navigateur (`required`, `type="number"`, etc.) est un confort et jamais la
  seule. Elle ne remplace pas le service et n'en copie pas les règles.
- Une règle de la base (clé unique, `CHECK`) est un dernier filet, pas la validation : le
  dépôt la convertit en erreur du domaine, le service l'a normalement déjà refusée.
- Une nouvelle entrée qui écrit ou une nouvelle règle de validation vient avec un test qui
  envoie une saisie invalide au service, et vérifie que le dépôt n'est pas appelé (ou qu'aucune
  ligne n'est stockée).

## Comment vérifier

- Toute entrée qui écrit passe par le service (doit ne rien afficher) :
  `for f in $(grep -rl '"use server"' src/app) $(find src/app -name 'route.ts'); do grep -q '@/container' "$f" || echo "sans service: $f"; done`
- Aucune entrée n'écrit en direct (doit ne rien afficher) :
  `grep -rn '@/data\|@libsql' src/app`
- Aucune saisie convertie dans la présentation (doit ne rien afficher) :
  `grep -rnE 'parseInt|parseFloat|Number\(|\bas (Game|NewGame)\b' src/app src/components --include='*.ts' --include='*.tsx' | grep -v test`
- `pnpm test` passe : chaque règle a son test « refusé, et le dépôt n'est pas appelé ».
- `pnpm lint` bloque déjà `@/data` et `@libsql/*` dans `src/app`.
- Relecture : une nouvelle action ou un nouveau route handler appelle-t-il le service sans rien
  décider lui-même ? Aucune commande ne le prouve entièrement.
