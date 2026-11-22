import { DuplicateGameError, GAME_STATUSES, type Game, type GameRepository } from "@/services/games";

// Pour les tests et les exemples : ne persiste rien.
export function createMemoryRepository(): GameRepository {
  const games: Game[] = [];
  const keys = new Set<string>();
  return {
    list: async () => [...games],
    create: async (input) => {
      if (!GAME_STATUSES.includes(input.status)) throw new Error(`Statut inconnu : ${input.status}`);
      if (keys.has(input.key)) throw new DuplicateGameError();
      const { key, ...rest } = input;
      const game = { id: crypto.randomUUID(), ...rest };
      keys.add(key);
      games.push(game);
      return game;
    },
  };
}
