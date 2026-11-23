// Point d'assemblage : seul endroit qui choisit l'implémentation du stockage.
import { createLibsqlRepositoryFromEnv } from "@/data/libsql-repository";
import { addGame, normalizeKey, queryGames, removeGame, updateGame, type AddGameInput, type RawFilters } from "@/services/games";

// keyOf : sert uniquement à migrer une base créée avant la colonne `key`.
const repo = createLibsqlRepositoryFromEnv({ keyOf: normalizeKey });

export const games = {
  query: (raw: RawFilters) => queryGames(repo, raw),
  add: (input: AddGameInput) => addGame(repo, input),
  update: (id: unknown, input: AddGameInput) => updateGame(repo, id, input),
  remove: (id: unknown) => removeGame(repo, id),
};
