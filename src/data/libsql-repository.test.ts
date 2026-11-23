import { createClient } from "@libsql/client";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { normalizeKey } from "@/services/games";
import { createLibsqlRepository } from "./libsql-repository";
import { describeRepositoryContract } from "./repository.contract";

describeRepositoryContract("libSQL", () => createLibsqlRepository(createClient({ url: ":memory:" })));

test("critère 5 : les jeux sont toujours là après réouverture de la base", async () => {
  const file = join(tmpdir(), `ludotheque-test-${process.pid}-${Date.now()}.db`);
  const url = `file:${file}`;
  try {
    const first = createClient({ url });
    await createLibsqlRepository(first).create({ name: "Catan", key: "catan", status: "envie" });
    first.close();

    const second = createClient({ url });
    expect((await createLibsqlRepository(second).list()).map((g) => g.name)).toEqual(["Catan"]);
    second.close();
  } finally {
    rmSync(file, { force: true });
  }
});

test("l'échec de création de la table n'est pas mis en cache : la requête suivante réessaie", async () => {
  const real = createClient({ url: ":memory:" });
  let calls = 0;
  const flaky = new Proxy(real, {
    get: (t, p) =>
      p === "execute"
        ? (...a: Parameters<typeof real.execute>) => (calls++ === 0 ? Promise.reject(new Error("réseau")) : t.execute(...a))
        : Reflect.get(t, p),
  });
  const repo = createLibsqlRepository(flaky);
  await expect(repo.list()).rejects.toThrow("réseau");
  expect(await repo.list()).toEqual([]);
});

test("rien n'est exécuté à la création du dépôt (pas de rejet non géré à l'import)", () => {
  const real = createClient({ url: ":memory:" });
  let calls = 0;
  createLibsqlRepository(new Proxy(real, { get: (t, p) => (p === "execute" ? () => (calls++, Promise.reject(new Error("x"))) : Reflect.get(t, p)) }));
  expect(calls).toBe(0);
});

test("migration : une base à l'ancien schéma (sans key ni détails) garde ses jeux et accepte les nouveaux champs", async () => {
  const client = createClient({ url: ":memory:" });
  await client.execute("CREATE TABLE games (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('possede', 'envie')))");
  await client.execute("INSERT INTO games (id, name, status) VALUES ('1', 'Cätan', 'possede'), ('2', 'Azul', 'envie')");

  const repo = createLibsqlRepository(client, { keyOf: normalizeKey });
  expect((await repo.list()).map((g) => g.name).sort()).toEqual(["Azul", "Cätan"]);

  const created = await repo.create({ name: "Les Colons", key: "les colons", status: "envie", minPlayers: 3, maxPlayers: 4, duration: 60 });
  expect(created).toMatchObject({ minPlayers: 3, maxPlayers: 4, duration: 60 });
  // la clé des anciens jeux a été calculée : un doublon est refusé par la base
  await expect(repo.create({ name: "catan", key: "catan", status: "envie" })).rejects.toThrow(/déjà/);
});

test("migration : deux anciens jeux au même nom normalisé → erreur claire, base inchangée", async () => {
  const client = createClient({ url: ":memory:" });
  await client.execute("CREATE TABLE games (id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL)");
  await client.execute("INSERT INTO games (id, name, status) VALUES ('1', 'Catan', 'envie'), ('2', 'catan', 'envie')");
  const repo = createLibsqlRepository(client, { keyOf: normalizeKey });
  await expect(repo.list()).rejects.toThrow(/Migration impossible.*« Catan » et « catan »/);
  const cols = (await client.execute("PRAGMA table_info(games)")).rows.map((r) => String(r.name));
  expect(cols).toEqual(["id", "name", "status"]);
});
