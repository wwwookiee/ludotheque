import { createClient } from "@libsql/client";
import { expect, test } from "vitest";
import { addGame, listGames } from "@/services/games";
import { createLibsqlRepository } from "./libsql-repository";

const repo = () => createLibsqlRepository(createClient({ url: ":memory:" }));

test("critère 1 : Azul ajouté à Catan et élan, la liste est triée", async () => {
  const r = repo();
  await addGame(r, { name: "Catan" });
  await addGame(r, { name: "élan" });
  await addGame(r, { name: "Azul" });
  expect((await listGames(r)).map((g) => g.name)).toEqual(["Azul", "Catan", "élan"]);
});

test("critère 2 : « Les Colons » est stocké nettoyé, statut envie", async () => {
  const r = repo();
  await addGame(r, { name: "  Les   Colons " });
  expect(await listGames(r)).toMatchObject([{ name: "Les Colons", status: "envie" }]);
});

test("critère 4 : un doublon n'est pas stocké", async () => {
  const r = repo();
  await addGame(r, { name: "Catan" });
  expect(await addGame(r, { name: "Cätan" })).toMatchObject({ ok: false });
  expect(await listGames(r)).toHaveLength(1);
});
