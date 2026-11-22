import { createClient, type Client } from "@libsql/client";
import type { GameRepository, GameStatus } from "@/services/games";

// Seule implémentation qui parle à la base : SQLite en local (file:…), Turso en ligne (libsql://…).
export function createLibsqlRepository(client: Client): GameRepository {
  const ready = client.execute(
    "CREATE TABLE IF NOT EXISTS games (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('possede', 'envie')))",
  );

  return {
    async list() {
      await ready;
      const { rows } = await client.execute("SELECT id, name, status FROM games");
      return rows.map((r) => ({ id: String(r.id), name: String(r.name), status: r.status as GameStatus }));
    },
    async create(input) {
      await ready;
      const id = crypto.randomUUID();
      await client.execute({ sql: "INSERT INTO games (id, name, status) VALUES (?, ?, ?)", args: [id, input.name, input.status] });
      return { id, ...input };
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
