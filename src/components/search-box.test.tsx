import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { SearchBoxView } from "./search-box";

test("lot 5 : le champ de recherche est libellé et reprend la recherche en cours", () => {
  const html = renderToString(<SearchBoxView value="an" onChange={() => {}} />);
  expect(html).toContain("Rechercher un jeu");
  expect(html).toContain('name="q"');
  expect(html).toContain('value="an"');
});

test("lot 5 : sans recherche, le champ est vide", () => {
  expect(renderToString(<SearchBoxView value="" onChange={() => {}} />)).toContain('value=""');
});
