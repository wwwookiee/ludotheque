# Intention · Ludothèque

## Produit
Une bibliothèque personnelle de jeux de plateau.
Pour chaque jeu, je note : nom, nombre de joueurs (min et max), durée d'une partie, âge minimum, éditeur, notes personnelles.
Chaque jeu a un statut : possédé ou envie.
J'ajoute, je modifie et je supprime des jeux.
Je peux tout faire (consulter, ajouter, modifier, supprimer) sans quitter la liste des jeux.
Je ne peux pas supprimer un jeu par erreur : la suppression doit être confirmée.
La liste est triée par nom, par ordre alphabétique croissant, sans tenir compte des majuscules ni des accents.
Une recherche par nom affiche les jeux dont le nom contient le texte saisi, sans tenir compte des majuscules ni des accents. Une recherche vide affiche tous les jeux.

## Règles métier
- Le nom et le statut sont obligatoires. Le statut par défaut est « envie ». Les autres champs sont facultatifs.
- Le nom est nettoyé : sans espaces en début et en fin, et plusieurs espaces consécutifs réduits à un seul. Un nom vide après ce nettoyage est refusé.
- Le nombre de joueurs min et max sont renseignés ensemble ou pas du tout. Quand ils le sont, ce sont des entiers strictement supérieurs à 0 et min ≤ max.
- La durée (en minutes) et l'âge minimum (en années), quand ils sont renseignés, sont des entiers strictement supérieurs à 0.
- Deux jeux ne peuvent pas avoir le même nom. La comparaison se fait sur le nom nettoyé et ignore les majuscules et les accents (« Catan », « catan » et « Cätan » sont le même jeu).
- Si une saisie enfreint une règle, l'enregistrement est refusé, un message indique la règle enfreinte et ma saisie est conservée.

## Filtres
- Statut : possédé, envie ou tous.
- Nombre de joueurs N : affiche les jeux jouables à N joueurs (min ≤ N ≤ max).
- Durée X : affiche les jeux dont la durée est ≤ X minutes.
- Quand un filtre sur les joueurs ou la durée est actif, les jeux qui n'ont pas cette information sont masqués.
- N et X sont des entiers strictement supérieurs à 0.
- La recherche et les filtres se cumulent : un jeu n'est affiché que s'il les satisfait tous.
- À l'ouverture de la page, le statut est sur « tous » et aucun filtre sur les joueurs ou la durée n'est actif.

## Évolution
Je dois pouvoir changer de stockage plus tard sans que l'app change pour moi et sans perdre mes jeux.

## Contraintes
La version en ligne n'est accessible qu'à moi.
Les règles métier et les filtres sont vérifiés automatiquement : aucune version qui les enfreint n'est mise en ligne.

## Hors périmètre
Pas de gestion de droits, pas de multi-utilisateur.

## Critères d'acceptation
- J'ajoute un jeu, il apparaît dans la liste.
- Je modifie ou je supprime un jeu, la liste reflète le changement.
- Après redémarrage de l'app en local ou redéploiement en ligne, mes jeux sont toujours là.
- Après un changement de stockage, l'app fonctionne comme avant et mes jeux sont toujours là.
