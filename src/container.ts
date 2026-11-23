// Point d'assemblage : seul endroit qui choisit l'implémentation du stockage.
import { createLibsqlRepositoryFromEnv } from "@/data/libsql-repository";
import { addGame, listGames, type GameFilters, normalizeKey, removeGame, updateGame, type AddGameInput } from "@/services/games";

// keyOf : sert uniquement à migrer une base créée avant la colonne `key`.
const repo = createLibsqlRepositoryFromEnv({ keyOf: normalizeKey });

export const games = {
  list: (filters?: GameFilters) => listGames(repo, filters),
  add: (input: AddGameInput) => addGame(repo, input),
  update: (id: string, input: AddGameInput) => updateGame(repo, id, input),
  remove: (id: string) => removeGame(repo, id),
};
