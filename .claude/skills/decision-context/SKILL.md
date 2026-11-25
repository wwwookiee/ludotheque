---
name: decision-context
description: Lit et écrit les décisions d'architecture du projet (ADR) dans docs/decisions/. À utiliser avant de proposer un choix d'architecture, de librairie ou de structure, et dès qu'une décision est prise avec des options écartées.
---

# decision-context · les décisions du projet

Les décisions d'architecture vivent dans `docs/decisions/`, un fichier par décision, commité avec le code. Format MADR, celui de Zero to Prod.

## Avant d'agir

1. Liste `docs/decisions/` et lis les ADR qui touchent ta tâche.
2. Ne propose pas une option qu'un ADR « accepted » a écartée. Si elle te semble meilleure, dis-le et demande d'abord.
3. Deux ADR « accepted » se contredisent : signale-le, ne tranche pas seul.

## Écrire un ADR

Quand un choix structurant est pris (architecture, librairie, structure, process) et que des options ont été écartées.

Fichier : `docs/decisions/NNN-<slug>.md`, numéro suivant le dernier, sur trois chiffres :

```markdown
# ADR <number> — <title>

- Status: accepted | superseded by <ADR number>
- Date: <YYYY-MM-DD>
- Scope: framing | story <id>

## Context
Le problème et les contraintes du moment.

## Decision
Ce qui est retenu.

## Considered options
- <option> — rejected because <reason>

## Consequences
Ce que ça change, en bien et en mal.
```

## Les règles

- Tu rédiges l'ADR et tu le montres au développeur. Tu ne l'écris qu'avec son accord.
- Un ADR est immuable. La décision change : nouvel ADR, et l'ancien passe à « superseded by <ADR number> ».
- « Considered options » est toujours rempli : c'est la section qui t'évite de reproposer un choix rejeté.
- Pas de secret dans un ADR : il est commité.
