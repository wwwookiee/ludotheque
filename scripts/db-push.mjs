// Applique le schéma sur la base distante (DATABASE_URL, DATABASE_AUTH_TOKEN), puis y copie les jeux de local.db.
// --schema-only : applique seulement le schéma. Les valeurs viennent de .env.turso (ignoré par git), jamais du code.
// Node charge les .ts importés ci-dessous directement (Node ≥ 22.18 retire les types).
import { createClient } from "@libsql/client";
import { exportGames } from "../src/data/libsql-export.ts";
import { migrate } from "../src/data/libsql-migrate.ts";

const url = process.env.DATABASE_URL;
if (!url || url.startsWith("file:")) {
  console.error("DATABASE_URL doit désigner la base Turso (renseigne-la dans .env.turso).");
  process.exit(1);
}

const target = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
await migrate(target); // idempotent : crée la table, ou met à niveau un ancien schéma
console.log(`Schéma à jour sur ${new URL(url).host}.`);

if (!process.argv.includes("--schema-only")) {
  const count = await exportGames(createClient({ url: "file:local.db" }), target);
  console.log(`${count} jeu(x) copié(s) depuis local.db.`);
}
