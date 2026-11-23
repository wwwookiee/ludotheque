import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { FiltersView } from "./filters";

const noop = () => {};
const empty = { q: "", status: "tous", players: "", duration: "" };

test("lot 6 : un statut vide (URL sans paramètre) s'affiche comme « Tous »", () => {
  expect(renderToString(<FiltersView values={{ ...empty, status: "" }} error={null} onChange={() => {}} />)).toContain("Tous");
});
const view = (values = empty, error: Parameters<typeof FiltersView>[0]["error"] = null) =>
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

test("statut en boutons : seul le statut actif est enfoncé (vide = « Tous »)", () => {
  expect(view({ ...empty, status: "possede" })).toMatch(/aria-pressed="true"[^>]*>Possédé</);
  expect((view({ ...empty, status: "" }).match(/aria-pressed="true"/g) ?? []).length).toBe(1);
  expect(view({ ...empty, status: "" })).toMatch(/aria-pressed="true"[^>]*>Tous</);
});
