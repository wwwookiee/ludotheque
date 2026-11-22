// Point d'assemblage : seul endroit qui choisit l'implémentation du stockage.
import { createLibsqlRepositoryFromEnv } from "@/data/libsql-repository";
import { addGame, listGames } from "@/services/games";

const repo = createLibsqlRepositoryFromEnv();

export const games = {
  list: () => listGames(repo),
  add: (input: { name: string }) => addGame(repo, input),
};
