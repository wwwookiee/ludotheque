import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { FiltersView } from "./filters";

const noop = () => {};
const empty = { q: "", status: "tous", players: "", duration: "" };
const view = (values = empty, error: { message: string; fields: ("status" | "players" | "duration")[] } | null = null) =>
  renderToString(<FiltersView values={values} error={error} onChange={noop} />);
const invalidCount = (html: string) => (html.match(/aria-invalid="true"/g) ?? []).length;

test("lot 5 : le champ de recherche est libellé et reprend la recherche en cours", () => {
  const html = view({ ...empty, q: "an" });
  expect(html).toContain("Rechercher un jeu");
  expect(html).toContain('name="q"');
  expect(html).toContain('value="an"');
});

test("lot 6, critère 5 : à l'ouverture, statut « tous » et aucun filtre joueurs ni durée", () => {
  const html = view();
  expect(html).toContain("Tous");
  expect(html).toContain('name="players"');
  expect(html).toContain('name="duration"');
  expect(html).not.toMatch(/name="(players|duration)"[^>]*value="[^"]/);
  expect(invalidCount(html)).toBe(0);
  expect(html).not.toContain('role="alert"');
});

test("lot 6 : les filtres actifs sont repris dans les champs", () => {
  const html = view({ q: "", status: "possede", players: "4", duration: "45" });
  expect(html).toContain("Possédé");
  expect(html).toContain('value="4"');
  expect(html).toContain('value="45"');
});

test("lot 6, critère 5 : un N refusé affiche le message du service et signale seulement le champ joueurs", () => {
  const html = view({ ...empty, players: "0" }, { message: "Le nombre de joueurs doit être un entier supérieur à 0.", fields: ["players"] });
  expect(html).toContain("Le nombre de joueurs doit être un entier supérieur à 0.");
  expect(html).toContain('role="alert"');
  expect(invalidCount(html)).toBe(1);
  expect(html).toContain('aria-describedby="filters-error"');
});
