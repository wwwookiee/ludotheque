import { expect, test } from "vitest";
import { applyFilter, toSearch, type FilterValues } from "./filters-query";

const empty: FilterValues = { q: "", status: "tous", players: "", duration: "" };

test("aucun filtre actif : pas de paramètre dans l'URL", () => {
  expect(toSearch(empty)).toBe("");
});

test("« tous » et les valeurs vides ou d'espaces ne sont pas écrits dans l'URL", () => {
  expect(toSearch({ q: "  ", status: "tous", players: "", duration: " " })).toBe("");
  expect(toSearch({ q: "cat", status: "possede", players: "4", duration: "45" })).toBe("q=cat&status=possede&players=4&duration=45");
});

test("accents et espaces de la recherche sont encodés", () => {
  expect(toSearch({ ...empty, q: "élan x" })).toBe("q=%C3%A9lan+x");
});

test("course : deux changements enchaînés avant la fin de la navigation s'accumulent (la recherche n'est pas perdue)", () => {
  // L'URL du navigateur n'est pas encore à jour entre les deux : seules les valeurs courantes comptent.
  const afterTyping = applyFilter(empty, "q", "cat");
  const afterStatus = applyFilter(afterTyping, "status", "possede");
  expect(toSearch(afterStatus)).toBe("q=cat&status=possede");
});

test("un changement ne touche pas les autres filtres, et on peut revenir à « tous »", () => {
  const v = applyFilter({ q: "cat", status: "possede", players: "4", duration: "" }, "status", "tous");
  expect(v).toEqual({ q: "cat", status: "tous", players: "4", duration: "" });
  expect(toSearch(v)).toBe("q=cat&players=4");
});
