import type { GameRepository } from "@/services/games";

export function createMemoryRepository(): GameRepository {
  return { list: async () => [] };
}
