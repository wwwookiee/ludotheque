import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { GameList } from "./game-list";

const remove = async () => ({ error: null });
const update = async () => ({ error: null, fields: [], values: { name: "", status: "envie", minPlayers: "", maxPlayers: "", duration: "", minAge: "", publisher: "", notes: "" } });

test("liste vide : affiche « Aucun jeu »", () => {
  expect(renderToString(<GameList updateAction={update} deleteAction={remove} games={[]} />)).toContain("Aucun jeu");
});

test("critère 1 : affiche les jeux dans l'ordre reçu, avec leur statut", () => {
  const html = renderToString(
    <GameList updateAction={update} deleteAction={remove} games={[
        { id: "1", name: "Azul", status: "envie" },
        { id: "2", name: "Catan", status: "possede" },
      ]}
    />,
  );
  expect(html.indexOf("Azul")).toBeGreaterThan(-1);
  expect(html.indexOf("Azul")).toBeLessThan(html.indexOf("Catan"));
  expect(html).toContain("Possédé");
  expect(html).toContain("Envie");
});

test("lot 2, critère 1 : la liste affiche joueurs, durée, âge, éditeur et notes", () => {
  const html = renderToString(
    <GameList updateAction={update} deleteAction={remove} games={[{ id: "1", name: "Catan", status: "possede", minPlayers: 2, maxPlayers: 4, duration: 45, minAge: 8, publisher: "Kosmos", notes: "Extension à acheter" }]}
    />,
  );
  expect(html).toContain("2–4 joueurs · 45 min · 8 ans et + · Kosmos");
  expect(html).toContain("Extension à acheter");
});

test("lot 2 : min = max s'écrit « 4 joueurs », un champ vide disparaît avec son séparateur", () => {
  const html = renderToString(<GameList updateAction={update} deleteAction={remove} games={[{ id: "1", name: "Solo", status: "envie", minPlayers: 1, maxPlayers: 1, minAge: 12 }]} />);
  expect(html).toContain("1 joueur · 12 ans et +");
  expect(html).not.toContain("min ·");
});

test("lot 2, critère 4 : un jeu sans détail n'a pas de ligne de détails", () => {
  const html = renderToString(<GameList updateAction={update} deleteAction={remove} games={[{ id: "1", name: "Azul", status: "envie" }]} />);
  expect(html).not.toContain("joueur");
  expect(html).not.toContain("data-slot=\"game-details\"");
});
