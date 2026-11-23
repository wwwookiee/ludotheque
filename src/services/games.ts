export const GAME_STATUSES = ["possede", "envie"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

// Les détails sont facultatifs : un détail non renseigné est absent (jamais null ni 0).
export type Game = {
  id: string;
  name: string;
  status: GameStatus;
  minPlayers?: number;
  maxPlayers?: number;
  duration?: number; // minutes
  minAge?: number; // années
  publisher?: string;
  notes?: string;
};
// key : clé d'unicité calculée par le service (normalizeKey) ; le dépôt la rend unique.
export type NewGame = Omit<Game, "id"> & { key: string };

// Levée par un dépôt quand la clé existe déjà (deux ajouts simultanés, par exemple).
export class DuplicateGameError extends Error {
  constructor() {
    super("Un jeu porte déjà ce nom.");
  }
}

export interface GameRepository {
  list(): Promise<Game[]>;
  create(game: NewGame): Promise<Game>;
  // Remplace tous les champs du jeu. null si le jeu n'existe pas ; DuplicateGameError si la clé est prise par un autre jeu.
  update(id: string, game: NewGame): Promise<Game | null>;
  // true si le jeu existait et a été supprimé.
  remove(id: string): Promise<boolean>;
}

export type AddGameRule =
  | "name-required"
  | "name-duplicate"
  | "status-invalid"
  | "players-pair"
  | "players-positive-integer"
  | "players-min-max"
  | "duration-positive-integer"
  | "age-positive-integer"
  | "game-not-found";
// Champs de la saisie fautifs, pour que la présentation signale le bon champ.
export type AddGameField = "name" | "status" | "minPlayers" | "maxPlayers" | "duration" | "minAge";
export type AddGameError = { rule: AddGameRule; message: string; fields: AddGameField[] };

// Saisie brute du formulaire : tout est du texte, c'est le service qui valide et convertit.
export type AddGameInput = {
  name: string;
  status?: string;
  minPlayers?: string;
  maxPlayers?: string;
  duration?: string;
  minAge?: string;
  publisher?: string;
  notes?: string;
};
export type AddGameResult = { ok: true; game: Game } | { ok: false; error: AddGameError };

// Nom nettoyé : sans espaces aux extrémités, espaces multiples réduits à un.
export function cleanName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

// Clé de comparaison unique (tri, doublons) : sans casse, sans accents.
export function normalizeKey(name: string): string {
  return cleanName(name).normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export type GameFilters = { q?: string };

// Même normalisation que le tri et l'unicité : sans casse, sans accents, espaces réduits.
export function filterGames(games: Game[], filters: GameFilters = {}): Game[] {
  const q = normalizeKey(filters.q ?? "");
  return q ? games.filter((g) => normalizeKey(g.name).includes(q)) : games;
}

export async function listGames(repo: GameRepository, filters: GameFilters = {}): Promise<Game[]> {
  const games = filterGames(await repo.list(), filters);
  const key = (g: Game) => normalizeKey(g.name);
  return [...games].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

const refuse = (rule: AddGameRule, message: string, ...fields: AddGameField[]) => ({ ok: false, error: { rule, message, fields } }) as const;

// Vide ou espaces → undefined (non renseigné). Sinon un entier > 0, ou null si la saisie est invalide.
function positiveInt(raw: string | undefined): number | undefined | null {
  const text = (raw ?? "").trim();
  if (!text) return undefined;
  const n = Number(text);
  return /^\d+$/.test(text) && n > 0 && Number.isSafeInteger(n) ? n : null;
}

function optionalText(raw: string | undefined): string | undefined {
  return cleanName(raw ?? "") || undefined;
}

// Valide et convertit la saisie brute. Partagé par l'ajout et la modification : mêmes règles.
function validate(input: AddGameInput): { ok: true; value: NewGame } | { ok: false; error: AddGameError } {
  const name = cleanName(input.name);
  if (!name) return refuse("name-required", "Le nom est obligatoire.", "name");

  const status = input.status || "envie";
  if (!(GAME_STATUSES as readonly string[]).includes(status)) return refuse("status-invalid", "Le statut doit être « possédé » ou « envie ».", "status");

  const minPlayers = positiveInt(input.minPlayers);
  const maxPlayers = positiveInt(input.maxPlayers);
  if (minPlayers === null || maxPlayers === null) return refuse("players-positive-integer", "Le nombre de joueurs doit être un entier supérieur à 0.", "minPlayers", "maxPlayers");
  if ((minPlayers === undefined) !== (maxPlayers === undefined)) return refuse("players-pair", "Renseigne le nombre de joueurs min et max ensemble, ou aucun des deux.", "minPlayers", "maxPlayers");
  if (minPlayers !== undefined && maxPlayers !== undefined && minPlayers > maxPlayers) return refuse("players-min-max", "Le minimum de joueurs ne peut pas dépasser le maximum.", "minPlayers", "maxPlayers");

  const duration = positiveInt(input.duration);
  if (duration === null) return refuse("duration-positive-integer", "La durée doit être un entier supérieur à 0 (en minutes).", "duration");
  const minAge = positiveInt(input.minAge);
  if (minAge === null) return refuse("age-positive-integer", "L'âge minimum doit être un entier supérieur à 0 (en années).", "minAge");

  const details = { minPlayers, maxPlayers, duration, minAge, publisher: optionalText(input.publisher), notes: input.notes?.trim() || undefined };
  const present = Object.fromEntries(Object.entries(details).filter(([, v]) => v !== undefined));
  return { ok: true, value: { name, key: normalizeKey(name), status: status as GameStatus, ...present } };
}

const duplicate = () => refuse("name-duplicate", "Un jeu porte déjà ce nom.", "name");

export async function addGame(repo: GameRepository, input: AddGameInput): Promise<AddGameResult> {
  const checked = validate(input);
  if (!checked.ok) return checked;
  if ((await repo.list()).some((g) => normalizeKey(g.name) === checked.value.key)) return duplicate();
  try {
    return { ok: true, game: await repo.create(checked.value) };
  } catch (e) {
    if (e instanceof DuplicateGameError) return duplicate(); // le dépôt a refusé : un autre ajout est passé entre-temps
    throw e;
  }
}

// Modifie un jeu : mêmes règles que l'ajout, sauf que le jeu ne se compare pas à lui-même pour l'unicité.
export async function updateGame(repo: GameRepository, id: string, input: AddGameInput): Promise<AddGameResult> {
  const checked = validate(input);
  if (!checked.ok) return checked;
  const notFound = refuse("game-not-found", "Ce jeu n'existe plus.");
  const games = await repo.list();
  if (!games.some((g) => g.id === id)) return notFound;
  if (games.some((g) => g.id !== id && normalizeKey(g.name) === checked.value.key)) return duplicate();
  try {
    const game = await repo.update(id, checked.value);
    return game ? { ok: true, game } : notFound;
  } catch (e) {
    if (e instanceof DuplicateGameError) return duplicate();
    throw e;
  }
}

export type RemoveGameResult = { ok: true } | { ok: false; error: AddGameError };

// La confirmation est un geste de l'écran : quand le service reçoit la demande, elle a été faite.
export async function removeGame(repo: GameRepository, id: string): Promise<RemoveGameResult> {
  return (await repo.remove(id)) ? { ok: true } : refuse("game-not-found", "Ce jeu n'existe plus.");
}
