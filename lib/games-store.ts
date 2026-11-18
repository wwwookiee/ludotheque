// Seul point d'accès au stockage : le reste de l'app ne parle qu'à ce module.
// Changer de stockage = réécrire ce fichier. Les règles métier n'ont rien à faire ici.
import { createClient, type Row } from "@libsql/client";

export type GameStatus = "possede" | "envie";

export type Game = {
  id: number;
  name: string;
  status: GameStatus;
  playersMin: number | null;
  playersMax: number | null;
  duration: number | null;
  minAge: number | null;
  publisher: string | null;
  notes: string | null;
};

export type GameInput = Omit<Game, "id">;

// En local : fichier local.db. En ligne : Turso via TURSO_DATABASE_URL et TURSO_AUTH_TOKEN.
const db = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ponytail: schéma créé au premier appel, sans outil de migration ; en ajouter un au premier changement de schéma.
let ready: Promise<unknown> | undefined;
function init() {
  return (ready ??= db.execute(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      players_min INTEGER,
      players_max INTEGER,
      duration INTEGER,
      min_age INTEGER,
      publisher TEXT,
      notes TEXT
    )`));
}

const toGame = (r: Row): Game => ({
  id: Number(r.id),
  name: String(r.name),
  status: r.status as GameStatus,
  playersMin: r.players_min as number | null,
  playersMax: r.players_max as number | null,
  duration: r.duration as number | null,
  minAge: r.min_age as number | null,
  publisher: r.publisher as string | null,
  notes: r.notes as string | null,
});

const values = (g: GameInput) => [
  g.name, g.status, g.playersMin, g.playersMax, g.duration, g.minAge, g.publisher, g.notes,
];

export async function listGames(): Promise<Game[]> {
  await init();
  const { rows } = await db.execute("SELECT * FROM games");
  return rows.map(toGame);
}

export async function addGame(game: GameInput): Promise<Game> {
  await init();
  const res = await db.execute({
    sql: `INSERT INTO games (name, status, players_min, players_max, duration, min_age, publisher, notes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: values(game),
  });
  return { id: Number(res.lastInsertRowid), ...game };
}

export async function updateGame(id: number, game: GameInput): Promise<void> {
  await init();
  await db.execute({
    sql: `UPDATE games SET name = ?, status = ?, players_min = ?, players_max = ?, duration = ?,
          min_age = ?, publisher = ?, notes = ? WHERE id = ?`,
    args: [...values(game), id],
  });
}

export async function deleteGame(id: number): Promise<void> {
  await init();
  await db.execute({ sql: "DELETE FROM games WHERE id = ?", args: [id] });
}
