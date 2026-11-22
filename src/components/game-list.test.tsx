import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { GameList } from "./game-list";

test("liste vide : affiche « Aucun jeu »", () => {
  expect(renderToString(<GameList games={[]} />)).toContain("Aucun jeu");
});

test("critère 1 : affiche les jeux dans l'ordre reçu, avec leur statut", () => {
  const html = renderToString(
    <GameList
      games={[
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
