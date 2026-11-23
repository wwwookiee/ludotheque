import type { Client } from "@libsql/client";

export const CREATE_TABLE =
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

// Crée la table, ou met à niveau une base d'un ancien schéma sans perdre de jeu. Idempotent : sans effet si la base est à jour.
// keyOf : calcule la clé d'unicité des jeux d'une base créée avant la colonne `key` (seul usage).
export async function migrate(client: Client, keyOf?: (name: string) => string): Promise<void> {
  await client.execute(CREATE_TABLE);
  const columns = new Set((await client.execute("PRAGMA table_info(games)")).rows.map((r) => String(r.name)));
  const statements: (string | { sql: string; args: string[] })[] = [];

  if (!columns.has("key")) {
    if (!keyOf) throw new Error("Migration impossible : la table n'a pas de colonne key et aucun calcul de clé n'est fourni.");
    const keys = new Map<string, { id: string; name: string }>();
    for (const row of (await client.execute("SELECT id, name FROM games")).rows) {
      const key = keyOf(String(row.name));
      const found = keys.get(key);
      if (found) throw new Error(`Migration impossible : « ${found.name} » et « ${String(row.name)} » ont le même nom une fois normalisé. Renomme ou supprime l'un des deux dans la base.`);
      keys.set(key, { id: String(row.id), name: String(row.name) });
    }
    statements.push(
      "ALTER TABLE games ADD COLUMN key TEXT",
      ...[...keys].map(([key, { id }]) => ({ sql: "UPDATE games SET key = ? WHERE id = ?", args: [key, id] })),
      "CREATE UNIQUE INDEX games_key ON games(key)",
    );
  }
  statements.push(...Object.entries(ADD_COLUMNS).filter(([column]) => !columns.has(column)).map(([, statement]) => statement));

  // Une seule transaction : tout est appliqué, ou rien.
  if (statements.length > 0) await client.batch(statements, "write");
}
