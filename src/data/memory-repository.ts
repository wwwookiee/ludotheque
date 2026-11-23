import { DuplicateGameError, isGameStatus, type Game, type GameRepository } from "@/services/games";

// Pour les tests et les exemples : ne persiste rien.
export function createMemoryRepository(): GameRepository {
  const rows: { game: Game; key: string }[] = [];
  const taken = (key: string, except?: string) => rows.some((r) => r.key === key && r.game.id !== except);
  const checkStatus = (status: string) => {
    if (!isGameStatus(status)) throw new Error(`Statut inconnu : ${status}`);
  };

  return {
    list: async () => rows.map((r) => r.game),
    create: async ({ key, ...rest }) => {
      checkStatus(rest.status);
      if (taken(key)) throw new DuplicateGameError();
      const game = { id: crypto.randomUUID(), ...rest };
      rows.push({ game, key });
      return game;
    },
    update: async (id, { key, ...rest }) => {
      const row = rows.find((r) => r.game.id === id);
      if (!row) return null;
      checkStatus(rest.status);
      if (taken(key, id)) throw new DuplicateGameError();
      row.game = { id, ...rest };
      row.key = key;
      return row.game;
    },
    remove: async (id) => {
      const i = rows.findIndex((r) => r.game.id === id);
      if (i < 0) return false;
      rows.splice(i, 1);
      return true;
    },
  };
}
