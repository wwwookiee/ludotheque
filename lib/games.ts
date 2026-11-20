// Couche métier : seul point d'entrée pour la présentation. Vérifie les règles, puis appelle le stockage.
import { addGame, deleteGame, listGames, updateGame, type Game, type GameInput } from "./games-store";
import { filterGames, normalizeName, validateGame, type Filters } from "./game-rules";

export type { Filters, Game, GameInput };
export type Result = { ok: true; game: Game } | { ok: false; errors: string[] };

// Statut facultatif à la saisie : « envie » par défaut.
type NewGame = Omit<GameInput, "status"> & { status?: Game["status"] };

const clean = (g: NewGame): GameInput => ({ ...g, name: normalizeName(g.name), status: g.status ?? "envie" });

export async function getGames(filters: Filters = {}): Promise<Game[]> {
  return filterGames(await listGames(), filters);
}

// ponytail: unicité vérifiée en lisant toute la liste ; suffit pour un seul utilisateur.
export async function createGame(input: NewGame): Promise<Result> {
  const game = clean(input);
  const errors = validateGame(game, await listGames());
  return errors.length ? { ok: false, errors } : { ok: true, game: await addGame(game) };
}

export async function editGame(id: number, input: NewGame): Promise<Result> {
  const game = clean(input);
  const errors = validateGame(game, await listGames(), id);
  if (errors.length) return { ok: false, errors };
  await updateGame(id, game);
  return { ok: true, game: { id, ...game } };
}

export async function removeGame(id: number): Promise<void> {
  await deleteGame(id);
}
