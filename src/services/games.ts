export type Game = { id: string; name: string };

export interface GameRepository {
  list(): Promise<Game[]>;
}

export function listGames(repo: GameRepository): Promise<Game[]> {
  return repo.list();
}
