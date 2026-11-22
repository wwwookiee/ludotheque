export const GAME_STATUSES = ["possede", "envie"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export type Game = { id: string; name: string; status: GameStatus };
// key : clé d'unicité calculée par le service (normalizeKey) ; le dépôt la rend unique.
export type NewGame = { name: string; key: string; status: GameStatus };

// Levée par un dépôt quand la clé existe déjà (deux ajouts simultanés, par exemple).
export class DuplicateGameError extends Error {
  constructor() {
    super("Un jeu porte déjà ce nom.");
  }
}

export interface GameRepository {
  list(): Promise<Game[]>;
  create(game: NewGame): Promise<Game>;
}

export type AddGameError = { rule: "name-required" | "name-duplicate"; message: string };
export type AddGameResult = { ok: true; game: Game } | { ok: false; error: AddGameError };

// Nom nettoyé : sans espaces aux extrémités, espaces multiples réduits à un.
export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

// Clé de comparaison unique (tri, doublons) : sans casse, sans accents.
export function normalizeKey(name: string): string {
  return cleanName(name).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export async function listGames(repo: GameRepository): Promise<Game[]> {
  const games = await repo.list();
  const key = (g: Game) => normalizeKey(g.name);
  return [...games].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

export async function addGame(repo: GameRepository, input: { name: string }): Promise<AddGameResult> {
  const name = cleanName(input.name);
  if (!name) return { ok: false, error: { rule: "name-required", message: "Le nom est obligatoire." } };

  const key = normalizeKey(name);
  const duplicate = { ok: false, error: { rule: "name-duplicate", message: "Un jeu porte déjà ce nom." } } as const;
  if ((await repo.list()).some((g) => normalizeKey(g.name) === key)) return duplicate;
  try {
    return { ok: true, game: await repo.create({ name, key, status: "envie" }) };
  } catch (e) {
    if (e instanceof DuplicateGameError) return duplicate; // le dépôt a refusé : un autre ajout est passé entre-temps
    throw e;
  }
}
