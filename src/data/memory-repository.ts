import { GAME_STATUSES, type Game, type GameRepository } from "@/services/games";

// Pour les tests et les exemples : ne persiste rien.
export function createMemoryRepository(): GameRepository {
  const games: Game[] = [];
  return {
    list: async () => [...games],
    create: async (input) => {
      if (!GAME_STATUSES.includes(input.status)) throw new Error(`Statut inconnu : ${input.status}`);
      const game = { id: crypto.randomUUID(), ...input };
      games.push(game);
      return game;
    },
  };
}
