import type { Client } from "@libsql/client";

// Pas d'import relatif ici : le script scripts/db-push.mjs charge ce fichier directement avec Node.
// Même ordre que les colonnes des requêtes ci-dessous.
const COLUMNS = ["id", "name", "key", "status", "min_players", "max_players", "duration", "min_age", "publisher", "notes"];

// Copie tous les jeux de `from` vers `to`, sans les transformer (ids et clés compris), en une seule transaction.
// Les deux bases doivent avoir le schéma à jour (migrate). Refuse une cible non vide : ni doublon, ni écrasement.
// Renvoie le nombre de jeux copiés.
export async function exportGames(from: Client, to: Client): Promise<number> {
  const existing = Number((await to.execute("SELECT COUNT(*) AS n FROM games")).rows[0].n);
  if (existing > 0) throw new Error(`La base cible contient déjà ${existing} jeu${existing > 1 ? "x" : ""} : export annulé, rien n'a été écrit.`);

  const { rows } = await from.execute("SELECT id, name, key, status, min_players, max_players, duration, min_age, publisher, notes FROM games");
  if (rows.length === 0) return 0;
  await to.batch(
    rows.map((row) => ({
      sql: "INSERT INTO games (id, name, key, status, min_players, max_players, duration, min_age, publisher, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: COLUMNS.map((c) => row[c]),
    })),
    "write",
  );
  return rows.length;
}
