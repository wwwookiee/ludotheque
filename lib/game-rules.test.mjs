// Vérifie les règles métier et les filtres de INTENT.md. Lancer : pnpm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { filterGames, nameKey, normalizeName, validateGame } from "./game-rules.ts";

const game = (o = {}) => ({
  id: 1, name: "Catan", status: "envie", playersMin: null, playersMax: null,
  duration: null, minAge: null, publisher: null, notes: null, ...o,
});
const input = (o = {}) => {
  const g = game(o);
  delete g.id;
  return g;
};

test("nom nettoyé et comparé sans majuscules ni accents", () => {
  assert.equal(normalizeName("  Les   Aventuriers  "), "Les Aventuriers");
  assert.equal(nameKey(" Cätan "), nameKey("catan"));
});

test("nom obligatoire, vide après nettoyage refusé", () => {
  assert.equal(validateGame(input({ name: "   " }), []).length, 1);
  assert.deepEqual(validateGame(input(), []), []);
});

test("nom unique, sauf le jeu lui-même", () => {
  const others = [game({ id: 1, name: "Catan" })];
  assert.equal(validateGame(input({ name: "cätan " }), others).length, 1);
  assert.deepEqual(validateGame(input({ name: "Catan" }), others, 1), []);
});

test("statut possédé ou envie", () => {
  assert.equal(validateGame(input({ status: "autre" }), []).length, 1);
});

test("joueurs min et max ensemble, entiers > 0, min ≤ max", () => {
  assert.equal(validateGame(input({ playersMin: 2 }), []).length, 1);
  assert.equal(validateGame(input({ playersMin: 0, playersMax: 4 }), []).length, 1);
  assert.equal(validateGame(input({ playersMin: 5, playersMax: 4 }), []).length, 1);
  assert.deepEqual(validateGame(input({ playersMin: 4, playersMax: 4 }), []), []);
});

test("durée et âge : entiers > 0 quand renseignés", () => {
  assert.equal(validateGame(input({ duration: 0 }), []).length, 1);
  assert.equal(validateGame(input({ minAge: 1.5 }), []).length, 1);
  assert.deepEqual(validateGame(input({ duration: 30, minAge: 8 }), []), []);
});

const games = [
  game({ id: 1, name: "Zombicide", status: "possede", playersMin: 1, playersMax: 6, duration: 60 }),
  game({ id: 2, name: "Échecs", status: "possede", playersMin: 2, playersMax: 2, duration: 30 }),
  game({ id: 3, name: "azul", status: "envie", playersMin: 2, playersMax: 4, duration: 45 }),
  game({ id: 4, name: "Dixit", status: "envie" }),
];
const names = (f) => filterGames(games, f).map((g) => g.name);

test("tri par nom sans majuscules ni accents, recherche vide = tous", () => {
  assert.deepEqual(names({}), ["azul", "Dixit", "Échecs", "Zombicide"]);
  assert.deepEqual(names({ search: "" }), ["azul", "Dixit", "Échecs", "Zombicide"]);
});

test("recherche : le nom contient le texte, sans majuscules ni accents", () => {
  assert.deepEqual(names({ search: "ECHE" }), ["Échecs"]);
});

test("filtres statut, joueurs, durée ; infos manquantes masquées", () => {
  assert.deepEqual(names({ status: "envie" }), ["azul", "Dixit"]);
  assert.deepEqual(names({ players: 5 }), ["Zombicide"]);
  assert.deepEqual(names({ duration: 45 }), ["azul", "Échecs"]);
});

test("recherche et filtres se cumulent", () => {
  assert.deepEqual(names({ status: "possede", players: 2, search: "z" }), ["Zombicide"]);
});
