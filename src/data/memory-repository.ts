import { DuplicateGameError, GAME_STATUSES, type Game, type GameRepository } from "@/services/games";

// Pour les tests et les exemples : ne persiste rien.
export function createMemoryRepository(): GameRepository {
  const games: Game[] = [];
  const keys = new Map<string, string>(); // clé → id
  return {
    list: async () => [...games],
    create: async (input) => {
      if (!GAME_STATUSES.includes(input.status)) throw new Error(`Statut inconnu : ${input.status}`);
      if (keys.has(input.key)) throw new DuplicateGameError();
      const { key, ...rest } = input;
      const game = { id: crypto.randomUUID(), ...rest };
      keys.set(key, game.id);
      games.push(game);
      return game;
    },
    update: async (id, input) => {
      const i = games.findIndex((g) => g.id === id);
      if (i < 0) return null;
      if (!GAME_STATUSES.includes(input.status)) throw new Error(`Statut inconnu : ${input.status}`);
      const owner = keys.get(input.key);
      if (owner !== undefined && owner !== id) throw new DuplicateGameError();
      for (const [k, v] of keys) if (v === id) keys.delete(k);
      const { key, ...rest } = input;
      keys.set(key, id);
      games[i] = { id, ...rest };
      return games[i];
    },
  };
}
