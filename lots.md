# Lots · Ludothèque

Un lot est une chose que l'utilisateur fait de bout en bout, de l'écran à la base. Chaque lot se livre en une PR sur `dev`. Le lot 1 est le plus petit.

## Lot 1 · Ajouter un jeu et voir la liste
Je saisis le nom d'un jeu dans la liste et je l'enregistre. Il apparaît aussitôt dans la liste triée par nom, et il est toujours là après redémarrage. Ce lot pose la persistance (SQLite local via libSQL, `file:local.db`) et le premier formulaire.

- Étant donné une liste contenant « Catan » et « élan », quand j'ajoute « Azul », alors la liste affiche Azul, Catan, élan (tri croissant, sans tenir compte des majuscules ni des accents).
- Étant donné le formulaire, quand je saisis « ␣␣Les␣␣␣Colons␣ », alors le jeu est enregistré sous « Les Colons » avec le statut « envie ».
- Étant donné le formulaire, quand j'enregistre un nom vide ou fait d'espaces, alors l'enregistrement est refusé, un message nomme la règle et ma saisie est conservée.
- Étant donné un jeu « Catan », quand j'ajoute « catan » ou « Cätan », alors l'enregistrement est refusé avec le message de doublon.
- Étant donné un jeu ajouté, quand je redémarre l'app, alors le jeu est toujours dans la liste.

## Lot 2 · Détailler un jeu à l'ajout
Dans le même formulaire, je renseigne le nombre de joueurs (min et max), la durée, l'âge minimum, l'éditeur, mes notes et le statut (possédé ou envie). Les règles de validation des nombres s'appliquent.

- Étant donné le formulaire, quand je renseigne min 2 et max 4, une durée de 45 et un âge de 8, alors le jeu est enregistré et la liste affiche ces valeurs.
- Étant donné le formulaire, quand je renseigne seulement min ou seulement max, alors l'enregistrement est refusé et ma saisie est conservée.
- Étant donné le formulaire, quand min vaut 5 et max vaut 3, ou quand un nombre vaut 0, est négatif ou n'est pas entier, alors l'enregistrement est refusé avec la règle enfreinte.
- Étant donné le formulaire, quand je laisse joueurs, durée, âge, éditeur et notes vides, alors le jeu est enregistré.
- Étant donné un jeu, quand je choisis « possédé », alors la liste l'affiche avec ce statut.

## Lot 3 · Modifier un jeu depuis la liste
Je modifie un jeu directement dans la liste, sans la quitter. Les mêmes règles que pour l'ajout s'appliquent.

- Étant donné un jeu de la liste, quand je change son statut de « envie » à « possédé » et que j'enregistre, alors la liste reflète le changement.
- Étant donné un jeu « Catan », quand je renomme « Azul » en « Catan », alors la modification est refusée (doublon) et ma saisie est conservée.
- Étant donné un jeu « Catan », quand j'enregistre sa fiche en gardant le même nom, ou en changeant seulement la casse (« CATAN »), alors la modification est acceptée (le jeu ne se compare pas à lui-même).
- Étant donné un jeu, quand je saisis un min supérieur au max, alors la modification est refusée avec la règle enfreinte.
- Étant donné un jeu modifié, quand je redémarre l'app, alors la modification est conservée.

## Lot 4 · Supprimer un jeu avec confirmation
Je supprime un jeu depuis la liste. Une confirmation est demandée : je ne peux pas supprimer par erreur.

- Étant donné un jeu de la liste, quand je demande la suppression, alors une confirmation s'affiche et le jeu est toujours dans la liste.
- Étant donné la confirmation affichée, quand je la valide, alors le jeu disparaît de la liste.
- Étant donné la confirmation affichée, quand je l'annule, alors le jeu reste dans la liste, inchangé.
- Étant donné un jeu supprimé, quand je redémarre l'app, alors il n'est plus dans la liste.

## Lot 5 · Rechercher un jeu par nom
Je tape un texte et la liste n'affiche que les jeux dont le nom le contient.

- Étant donné « Catan », « Azul » et « Les Colons », quand je saisis « an », alors la liste affiche Catan.
- Étant donné un jeu « Élan », quand je saisis « elan » ou « ÉLAN », alors la liste affiche Élan (sans tenir compte des majuscules ni des accents).
- Étant donné une recherche active, quand je vide le champ, alors tous les jeux sont affichés.
- Étant donné une recherche sans résultat, quand elle s'applique, alors la liste affiche un état vide.
- Étant donné une recherche active, quand j'ajoute, modifie ou supprime un jeu, alors la liste reste filtrée par la recherche.

## Lot 6 · Filtrer la liste par statut, joueurs et durée
Je filtre la liste par statut, par nombre de joueurs N, ou par durée X. Les filtres se cumulent entre eux et avec la recherche.

- Étant donné des jeux possédés et des envies, quand je choisis « possédé », alors seuls les possédés s'affichent ; « envie » et « tous » fonctionnent de même.
- Étant donné un jeu à 2–4 joueurs, quand je saisis N = 4, alors il s'affiche ; avec N = 5, il est masqué.
- Étant donné un jeu de 45 minutes, quand je saisis X = 45, alors il s'affiche ; avec X = 30, il est masqué.
- Étant donné un jeu sans joueurs ou sans durée renseignés, quand un filtre sur les joueurs ou la durée est actif, alors il est masqué.
- Étant donné la page à l'ouverture, alors le statut est sur « tous » et aucun filtre joueurs ou durée n'est actif ; et un N ou X qui n'est pas un entier supérieur à 0 est refusé.

## Lot 7 · Mettre en ligne en privé
Je déploie l'app avec Turso comme base. Elle n'est accessible qu'à moi, et aucune version qui enfreint une règle métier ou un filtre n'est mise en ligne. Une fois en ligne, je retrouve mes jeux.

- Étant donné la version en ligne, quand une personne non autorisée ouvre l'URL, alors elle n'accède ni à la liste ni aux jeux.
- Étant donné la version en ligne, quand je suis autorisé, alors je consulte, ajoute, modifie et supprime des jeux comme en local.
- Étant donné une modification qui enfreint une règle métier ou un filtre, quand je la pousse, alors la CI échoue (lint, tsc, tests) et rien n'est mis en ligne.
- Étant donné des jeux en ligne, quand je redéploie, alors mes jeux sont toujours là.
- Étant donné mes jeux en local (`file:local.db`), quand je les exporte vers Turso, alors la liste en ligne est identique et la suite de tests de contrat passe sur les deux stockages.

Le mécanisme « accessible qu'à moi » se choisit au moment du lot. Recommandation : la protection d'accès de Vercel ou un secret unique, sans comptes ni rôles (hors-périmètre : pas de gestion de droits).

## Pour chaque lot
- Service : règles métier avec tests écrits avant le code, une fonction de normalisation unique (casse, accents, espaces).
- Données : dépôt libSQL avec suite de tests de contrat commune au dépôt mémoire.
- Présentation : composants du design system uniquement, `/design-system` mis à jour pour tout nouveau composant, écran vérifié en clair et en sombre.
