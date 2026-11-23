export const GAME_STATUSES = ["possede", "envie"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];
export const isGameStatus = (value: string): value is GameStatus => (GAME_STATUSES as readonly string[]).includes(value);

// Valeur du filtre de statut qui n'en retient aucun (état à l'ouverture).
export const ALL_STATUSES = "tous";

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

// Le service calcule la clé (normalizeKey) ; le dépôt garantit qu'elle est unique et lève DuplicateGameError sinon.
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
// Un refus : la règle enfreinte, un message en français affiché tel quel, et les champs fautifs.
export type Refusal<Rule extends string, Field extends string> = { rule: Rule; message: string; fields: Field[] };
export type AddGameError = Refusal<AddGameRule, AddGameField>;

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

// Filtres interprétés : la recherche, le statut, N joueurs, X minutes. Chacun est facultatif ; ils se cumulent.
export type GameFilters = { q?: string; status?: GameStatus | typeof ALL_STATUSES; players?: number; maxDuration?: number };

export function filterGames(games: Game[], filters: GameFilters = {}): Game[] {
  // Même normalisation que le tri et l'unicité : sans casse, sans accents, espaces réduits.
  const q = normalizeKey(filters.q ?? "");
  const { status = ALL_STATUSES, players, maxDuration } = filters;
  return games.filter(
    (g) =>
      (!q || normalizeKey(g.name).includes(q)) &&
      (status === ALL_STATUSES || g.status === status) &&
      // Un jeu sans l'information est masqué quand le filtre correspondant est actif.
      (players === undefined || (g.minPlayers !== undefined && g.maxPlayers !== undefined && g.minPlayers <= players && players <= g.maxPlayers)) &&
      (maxDuration === undefined || (g.duration !== undefined && g.duration <= maxDuration)),
  );
}

export async function listGames(repo: GameRepository, filters: GameFilters = {}): Promise<Game[]> {
  const games = filterGames(await repo.list(), filters);
  const key = (g: Game) => normalizeKey(g.name);
  return [...games].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0));
}

// Retire les clés valant undefined : un détail non renseigné est absent du jeu (jamais null ni undefined).
// Les noms de champs restent vérifiés par le type de l'objet passé.
export function omitUndefined<T extends Record<string, unknown>>(values: T): { [K in keyof T]?: Exclude<T[K], undefined> } {
  return Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined)) as { [K in keyof T]?: Exclude<T[K], undefined> };
}

const refusal = <Rule extends string, Field extends string>(rule: Rule, message: string, ...fields: Field[]): Refusal<Rule, Field> => ({ rule, message, fields });
const refuse = (rule: AddGameRule, message: string, ...fields: AddGameField[]) => ({ ok: false, error: refusal(rule, message, ...fields) }) as const;
const notFound = () => ({ ok: false, error: refusal<"game-not-found", never>("game-not-found", "Ce jeu n'existe plus.") }) as const;
// L'id vient du client (forgeable) : seule une chaîne non vide part au dépôt, le reste ne désigne aucun jeu.
const isId = (id: unknown): id is string => typeof id === "string" && id !== "";

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
  if (!isGameStatus(status)) return refuse("status-invalid", "Le statut doit être « possédé » ou « envie ».", "status");

  const minPlayers = positiveInt(input.minPlayers);
  const maxPlayers = positiveInt(input.maxPlayers);
  if (minPlayers === null || maxPlayers === null) return refuse("players-positive-integer", "Le nombre de joueurs doit être un entier supérieur à 0.", "minPlayers", "maxPlayers");
  if ((minPlayers === undefined) !== (maxPlayers === undefined)) return refuse("players-pair", "Renseigne le nombre de joueurs min et max ensemble, ou aucun des deux.", "minPlayers", "maxPlayers");
  if (minPlayers !== undefined && maxPlayers !== undefined && minPlayers > maxPlayers) return refuse("players-min-max", "Le minimum de joueurs ne peut pas dépasser le maximum.", "minPlayers", "maxPlayers");

  const duration = positiveInt(input.duration);
  if (duration === null) return refuse("duration-positive-integer", "La durée doit être un entier supérieur à 0 (en minutes).", "duration");
  const minAge = positiveInt(input.minAge);
  if (minAge === null) return refuse("age-positive-integer", "L'âge minimum doit être un entier supérieur à 0 (en années).", "minAge");

  const details = omitUndefined({ minPlayers, maxPlayers, duration, minAge, publisher: optionalText(input.publisher), notes: input.notes?.trim() || undefined });
  return { ok: true, value: { name, key: normalizeKey(name), status, ...details } };
}

const duplicate = () => refuse("name-duplicate", "Un jeu porte déjà ce nom.", "name");

export async function addGame(repo: GameRepository, input: AddGameInput): Promise<AddGameResult> {
  const checked = validate(input);
  if (!checked.ok) return checked;
  try {
    return { ok: true, game: await repo.create(checked.value) };
  } catch (e) {
    if (e instanceof DuplicateGameError) return duplicate(); // le dépôt garantit l'unicité de la clé
    throw e;
  }
}

// Modifie un jeu : mêmes règles que l'ajout ; le dépôt ne compare pas un jeu à lui-même pour l'unicité.
export async function updateGame(repo: GameRepository, id: unknown, input: AddGameInput): Promise<AddGameResult> {
  if (!isId(id)) return notFound();
  const checked = validate(input);
  if (!checked.ok) return checked;
  try {
    const game = await repo.update(id, checked.value);
    return game ? { ok: true, game } : notFound();
  } catch (e) {
    if (e instanceof DuplicateGameError) return duplicate();
    throw e;
  }
}

export type RemoveGameResult = { ok: true } | { ok: false; error: Refusal<"game-not-found", never> };

// La confirmation est un geste de l'écran : quand le service reçoit la demande, elle a été faite.
export async function removeGame(repo: GameRepository, id: unknown): Promise<RemoveGameResult> {
  if (!isId(id)) return notFound();
  return (await repo.remove(id)) ? { ok: true } : notFound();
}

// Saisie brute des filtres (paramètres d'URL) : du texte, le service valide et convertit.
export type RawFilters = { q?: string; status?: string; players?: string; duration?: string };
export type FilterField = "status" | "players" | "duration";
export type FilterError = Refusal<"status-filter-invalid" | "players-filter-integer" | "duration-filter-integer", FilterField>;
// active : au moins un filtre ou une recherche est appliqué. Si un filtre est refusé, error est renseignée et la liste est complète.
export type QueryGamesResult = { games: Game[]; active: boolean; error: FilterError | null };

// Liste filtrée et triée à partir de la saisie brute. Un N ou un X qui n'est pas un entier > 0 est refusé.
export async function queryGames(repo: GameRepository, raw: RawFilters): Promise<QueryGamesResult> {
  const refused = async (error: FilterError): Promise<QueryGamesResult> => ({ games: await listGames(repo), active: false, error });
  const requested = raw.status?.trim() || ALL_STATUSES;
  const status = requested === ALL_STATUSES ? ALL_STATUSES : isGameStatus(requested) ? requested : null;
  if (status === null) return refused(refusal("status-filter-invalid", "Le statut du filtre est invalide.", "status"));
  const players = positiveInt(raw.players);
  if (players === null) return refused(refusal("players-filter-integer", "Le nombre de joueurs doit être un entier supérieur à 0.", "players"));
  const maxDuration = positiveInt(raw.duration);
  if (maxDuration === null) return refused(refusal("duration-filter-integer", "La durée doit être un entier supérieur à 0 (en minutes).", "duration"));
  const active = Boolean(normalizeKey(raw.q ?? "")) || status !== ALL_STATUSES || players !== undefined || maxDuration !== undefined;
  return { games: await listGames(repo, { q: raw.q, status, players, maxDuration }), active, error: null };
}
