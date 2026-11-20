// Point d'assemblage : seul endroit qui choisit l'implémentation du stockage.
import { createMemoryRepository } from "@/data/memory-repository";
import { listGames } from "@/services/games";

const repo = createMemoryRepository();

export const games = { list: () => listGames(repo) };
