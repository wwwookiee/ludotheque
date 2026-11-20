import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { GameList } from "./game-list";

test("liste vide : affiche « Aucun jeu »", () => {
  expect(renderToString(<GameList games={[]} />)).toContain("Aucun jeu");
});
