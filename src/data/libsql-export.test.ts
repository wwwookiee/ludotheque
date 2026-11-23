import { createClient } from "@libsql/client";
import { expect, test } from "vitest";
import { exportGames } from "./libsql-export";
import { migrate } from "./libsql-migrate";
import { createLibsqlRepository } from "./libsql-repository";

const base = async () => {
  const client = createClient({ url: ":memory:" });
  await migrate(client);
  return client;
};

test("lot 7, critère 5 : les jeux locaux sont copiés à l'identique (ids, clés, détails)", async () => {
  const local = await base();
  const turso = await base();
  const repo = createLibsqlRepository(local);
  await repo.create({ name: "Catan", key: "catan", status: "possede", minPlayers: 3, maxPlayers: 4, duration: 75, minAge: 10, publisher: "Kosmos", notes: "Note" });
  await repo.create({ name: "Azul", key: "azul", status: "envie" });

  expect(await exportGames(local, turso)).toBe(2);

  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  expect((await createLibsqlRepository(turso).list()).sort(byName)).toEqual((await repo.list()).sort(byName));
  // La clé d'unicité est copiée : un doublon reste refusé dans la base cible.
  await expect(createLibsqlRepository(turso).create({ name: "Cätan", key: "catan", status: "envie" })).rejects.toThrow();
});

test("une base cible qui contient déjà des jeux est refusée, et rien n'y est écrit", async () => {
  const local = await base();
  const turso = await base();
  await createLibsqlRepository(local).create({ name: "Catan", key: "catan", status: "envie" });
  await createLibsqlRepository(turso).create({ name: "Azul", key: "azul", status: "envie" });

  await expect(exportGames(local, turso)).rejects.toThrow(/contient déjà 1 jeu/);
  expect((await createLibsqlRepository(turso).list()).map((g) => g.name)).toEqual(["Azul"]);
});

test("une base locale vide n'écrit rien", async () => {
  expect(await exportGames(await base(), await base())).toBe(0);
});
