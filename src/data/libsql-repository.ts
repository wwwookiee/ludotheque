import { createClient, type Client } from "@libsql/client";
import { DuplicateGameError, type GameRepository, type GameStatus } from "@/services/games";

// Seule implémentation qui parle à la base : SQLite en local (file:…), Turso en ligne (libsql://…).
export function createLibsqlRepository(client: Client): GameRepository {
  // Table créée à la première requête (pas à l'import) ; un échec n'est pas mis en cache : la requête suivante réessaie.
  let ready: Promise<unknown> | undefined;
  const init = () =>
    (ready ??= client
      .execute(
        "CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, name TEXT NOT NULL, key TEXT NOT NULL UNIQUE, status TEXT NOT NULL CHECK (status IN ('possede', 'envie')))",
      )
      .catch((e) => {
        ready = undefined;
        throw e;
      }));

  return {
    async list() {
      await init();
      const { rows } = await client.execute("SELECT id, name, status FROM games");
      return rows.map((r) => ({ id: String(r.id), name: String(r.name), status: r.status as GameStatus }));
    },
    async create(input) {
      await init();
      const id = crypto.randomUUID();
      try {
        await client.execute({ sql: "INSERT INTO games (id, name, key, status) VALUES (?, ?, ?, ?)", args: [id, input.name, input.key, input.status] });
      } catch (e) {
        if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) throw new DuplicateGameError();
        throw e;
      }
      return { id, name: input.name, status: input.status };
    },
  };
}

// Lit DATABASE_URL (défaut : fichier SQLite local) et DATABASE_AUTH_TOKEN (Turso) dans l'environnement.
export function createLibsqlRepositoryFromEnv(): GameRepository {
  return createLibsqlRepository(
    createClient({
      url: process.env.DATABASE_URL ?? "file:local.db",
      authToken: process.env.DATABASE_AUTH_TOKEN,
    }),
  );
}
