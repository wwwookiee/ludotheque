import { createClient, type Client, type Row } from "@libsql/client";
import { DuplicateGameError, type Game, type GameRepository, type GameStatus } from "@/services/games";

const CREATE_TABLE =
  "CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, name TEXT NOT NULL, key TEXT NOT NULL UNIQUE, status TEXT NOT NULL CHECK (status IN ('possede', 'envie')), min_players INTEGER, max_players INTEGER, duration INTEGER, min_age INTEGER, publisher TEXT, notes TEXT)";

// Colonnes ajoutées après coup à une base créée avec un ancien schéma.
const ADD_COLUMNS: Record<string, string> = {
  min_players: "ALTER TABLE games ADD COLUMN min_players INTEGER",
  max_players: "ALTER TABLE games ADD COLUMN max_players INTEGER",
  duration: "ALTER TABLE games ADD COLUMN duration INTEGER",
  min_age: "ALTER TABLE games ADD COLUMN min_age INTEGER",
  publisher: "ALTER TABLE games ADD COLUMN publisher TEXT",
  notes: "ALTER TABLE games ADD COLUMN notes TEXT",
};

const optional = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

function toGame(r: Row): Game {
  const detail = {
    minPlayers: optional(r.min_players as number | null),
    maxPlayers: optional(r.max_players as number | null),
    duration: optional(r.duration as number | null),
    minAge: optional(r.min_age as number | null),
    publisher: optional(r.publisher as string | null),
    notes: optional(r.notes as string | null),
  };
  const present = Object.fromEntries(Object.entries(detail).filter(([, v]) => v !== undefined));
  return { id: String(r.id), name: String(r.name), status: r.status as GameStatus, ...present };
}

// Seule implémentation qui parle à la base : SQLite en local (file:…), Turso en ligne (libsql://…).
// keyOf : calcule la clé d'unicité des jeux d'une base créée avant l'ajout de la colonne `key` (migration seulement).
export function createLibsqlRepository(client: Client, options: { keyOf?: (name: string) => string } = {}): GameRepository {
  async function migrate() {
    await client.execute(CREATE_TABLE);
    const columns = new Set((await client.execute("PRAGMA table_info(games)")).rows.map((r) => String(r.name)));

    if (!columns.has("key")) {
      if (!options.keyOf) throw new Error("Migration impossible : la table n'a pas de colonne key et aucun calcul de clé n'est fourni.");
      const keys = new Map<string, { id: string; name: string }>();
      for (const row of (await client.execute("SELECT id, name FROM games")).rows) {
        const key = options.keyOf(String(row.name));
        const found = keys.get(key);
        if (found) throw new Error(`Migration impossible : « ${found.name} » et « ${String(row.name)} » ont le même nom une fois normalisé. Renomme ou supprime l'un des deux dans la base.`);
        keys.set(key, { id: String(row.id), name: String(row.name) });
      }
      // Une seule transaction : tout est appliqué, ou rien.
      await client.batch(
        [
          "ALTER TABLE games ADD COLUMN key TEXT",
          ...[...keys].map(([key, { id }]) => ({ sql: "UPDATE games SET key = ? WHERE id = ?", args: [key, id] })),
          "CREATE UNIQUE INDEX games_key ON games(key)",
        ],
        "write",
      );
    }
    for (const [column, statement] of Object.entries(ADD_COLUMNS)) {
      if (!columns.has(column)) await client.execute(statement);
    }
  }

  // Préparée à la première requête (pas à l'import) ; un échec n'est pas mis en cache : la requête suivante réessaie.
  let ready: Promise<unknown> | undefined;
  const init = () =>
    (ready ??= migrate().catch((e) => {
      ready = undefined;
      throw e;
    }));

  return {
    async list() {
      await init();
      const { rows } = await client.execute("SELECT id, name, status, min_players, max_players, duration, min_age, publisher, notes FROM games");
      return rows.map(toGame);
    },
    async create(input) {
      await init();
      const id = crypto.randomUUID();
      try {
        await client.execute({
          sql: "INSERT INTO games (id, name, key, status, min_players, max_players, duration, min_age, publisher, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [id, input.name, input.key, input.status, input.minPlayers ?? null, input.maxPlayers ?? null, input.duration ?? null, input.minAge ?? null, input.publisher ?? null, input.notes ?? null],
        });
      } catch (e) {
        if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) throw new DuplicateGameError();
        throw e;
      }
      const { key, ...game } = input;
      void key;
      return { id, ...game };
    },
    async remove(id) {
      await init();
      const { rowsAffected } = await client.execute({ sql: "DELETE FROM games WHERE id = ?", args: [id] });
      return rowsAffected > 0;
    },
    async update(id, input) {
      await init();
      let rowsAffected: number;
      try {
        ({ rowsAffected } = await client.execute({
          sql: "UPDATE games SET name = ?, key = ?, status = ?, min_players = ?, max_players = ?, duration = ?, min_age = ?, publisher = ?, notes = ? WHERE id = ?",
          args: [input.name, input.key, input.status, input.minPlayers ?? null, input.maxPlayers ?? null, input.duration ?? null, input.minAge ?? null, input.publisher ?? null, input.notes ?? null, id],
        }));
      } catch (e) {
        if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) throw new DuplicateGameError();
        throw e;
      }
      if (rowsAffected === 0) return null;
      const { key, ...game } = input;
      void key;
      return { id, ...game };
    },
  };
}

// Lit DATABASE_URL (défaut : fichier SQLite local) et DATABASE_AUTH_TOKEN (Turso) dans l'environnement.
export function createLibsqlRepositoryFromEnv(options: { keyOf?: (name: string) => string } = {}): GameRepository {
  return createLibsqlRepository(
    createClient({
      url: process.env.DATABASE_URL ?? "file:local.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    }),
    options,
  );
}
