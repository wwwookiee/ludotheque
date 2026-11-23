import { createClient } from "@libsql/client";
import { expect, test } from "vitest";
import { addGame, listGames, updateGame } from "@/services/games";
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

test("lot 2, critères 1 et 5 : détails et statut « possédé » stockés et relus depuis la base", async () => {
  const r = repo();
  await addGame(r, { name: "Catan", status: "possede", minPlayers: "2", maxPlayers: "4", duration: "45", minAge: "8", publisher: "Kosmos" });
  expect(await listGames(r)).toMatchObject([{ name: "Catan", status: "possede", minPlayers: 2, maxPlayers: 4, duration: 45, minAge: 8, publisher: "Kosmos" }]);
});

test("lot 2, critère 3 : un détail invalide ne stocke rien", async () => {
  const r = repo();
  expect(await addGame(r, { name: "Catan", minPlayers: "5", maxPlayers: "3" })).toMatchObject({ ok: false, error: { rule: "players-min-max" } });
  expect(await listGames(r)).toHaveLength(0);
});

test("lot 3, critères 1 et 5 : le statut modifié est relu depuis la base", async () => {
  const r = repo();
  const added = await addGame(r, { name: "Catan" });
  if (!added.ok) throw new Error("ajout attendu");
  await updateGame(r, added.game.id, { name: "Catan", status: "possede" });
  expect(await listGames(r)).toMatchObject([{ name: "Catan", status: "possede" }]);
});

test("lot 3, critère 2 : un renommage en doublon ne change rien en base", async () => {
  const r = repo();
  await addGame(r, { name: "Catan" });
  const azul = await addGame(r, { name: "Azul" });
  if (!azul.ok) throw new Error("ajout attendu");
  expect(await updateGame(r, azul.game.id, { name: "cätan" })).toMatchObject({ ok: false, error: { rule: "name-duplicate" } });
  expect((await listGames(r)).map((g) => g.name)).toEqual(["Azul", "Catan"]);
});

test("lot 3, critère 3 : changer seulement la casse du nom est accepté", async () => {
  const r = repo();
  const catan = await addGame(r, { name: "Catan" });
  if (!catan.ok) throw new Error("ajout attendu");
  expect(await updateGame(r, catan.game.id, { name: "CATAN" })).toMatchObject({ ok: true });
  expect((await listGames(r)).map((g) => g.name)).toEqual(["CATAN"]);
});
