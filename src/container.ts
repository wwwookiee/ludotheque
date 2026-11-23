// Point d'assemblage : seul endroit qui choisit l'implémentation du stockage.
import { createLibsqlRepositoryFromEnv } from "@/data/libsql-repository";
import { addGame, listGames, normalizeKey, type AddGameInput } from "@/services/games";

// keyOf : sert uniquement à migrer une base créée avant la colonne `key`.
const repo = createLibsqlRepositoryFromEnv({ keyOf: normalizeKey });

export const games = {
  list: () => listGames(repo),
  add: (input: AddGameInput) => addGame(repo, input),
};
