import { createClient, type Client, type Row } from "@libsql/client";
import { DuplicateGameError, omitUndefined, type Game, type GameRepository, type GameStatus, type NewGame } from "@/services/games";
import { migrate } from "./libsql-migrate";

const optional = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

function toGame(r: Row): Game {
  const details = omitUndefined({
    minPlayers: optional(r.min_players as number | null),
    maxPlayers: optional(r.max_players as number | null),
    duration: optional(r.duration as number | null),
    minAge: optional(r.min_age as number | null),
    publisher: optional(r.publisher as string | null),
    notes: optional(r.notes as string | null),
  });
  return { id: String(r.id), name: String(r.name), status: r.status as GameStatus, ...details };
}

// Les valeurs d'un jeu, dans l'ordre des colonnes des requêtes ci-dessous.
const valuesOf = (g: NewGame) => [g.name, g.key, g.status, g.minPlayers ?? null, g.maxPlayers ?? null, g.duration ?? null, g.minAge ?? null, g.publisher ?? null, g.notes ?? null];

// Le jeu tel qu'il est stocké, sans la clé d'unicité (qui n'est pas une donnée du jeu).
function asGame(id: string, { key, ...rest }: NewGame): Game {
  void key;
  return { id, ...rest };
}

// Les erreurs de la base deviennent des erreurs du domaine : rien de libSQL ne remonte.
function toDomainError(e: unknown): never {
  if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) throw new DuplicateGameError();
  throw e;
}

// Seule implémentation qui parle à la base : SQLite en local (file:…), Turso en ligne (libsql://…).
// keyOf : voir migrate (base créée avant la colonne `key`).
export function createLibsqlRepository(client: Client, options: { keyOf?: (name: string) => string } = {}): GameRepository {
  // Préparée à la première requête (pas à l'import) ; un échec n'est pas mis en cache : la requête suivante réessaie.
  let ready: Promise<unknown> | undefined;
  const init = () =>
    (ready ??= migrate(client, options.keyOf).catch((e) => {
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
          sql: "INSERT INTO games (name, key, status, min_players, max_players, duration, min_age, publisher, notes, id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          args: [...valuesOf(input), id],
        });
      } catch (e) {
        toDomainError(e);
      }
      return asGame(id, input);
    },
    async update(id, input) {
      await init();
      try {
        const { rowsAffected } = await client.execute({
          sql: "UPDATE games SET name = ?, key = ?, status = ?, min_players = ?, max_players = ?, duration = ?, min_age = ?, publisher = ?, notes = ? WHERE id = ?",
          args: [...valuesOf(input), id],
        });
        return rowsAffected === 0 ? null : asGame(id, input);
      } catch (e) {
        toDomainError(e);
      }
    },
    async remove(id) {
      await init();
      const { rowsAffected } = await client.execute({ sql: "DELETE FROM games WHERE id = ?", args: [id] });
      return rowsAffected > 0;
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
