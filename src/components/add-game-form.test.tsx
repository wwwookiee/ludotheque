import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { AddGameFormView } from "./add-game-form";
import { emptyValues } from "./add-game-values";
import type { AddGameField } from "@/services/games";

const noop = () => {};
const view = (error: string | null, values = emptyValues, fields: AddGameField[] = []) =>
  renderToString(<AddGameFormView state={{ error, fields, values }} action={noop} pending={false} />);
const invalidCount = (html: string) => (html.match(/aria-invalid="true"/g) ?? []).length;

test("formulaire neuf : tous les champs, aucun message d'erreur", () => {
  const html = view(null);
  for (const name of ["name", "status", "minPlayers", "maxPlayers", "duration", "minAge", "publisher", "notes"]) {
    expect(html).toContain(`name="${name}"`);
  }
  expect(html).not.toContain('role="alert"');
});

test("le statut par défaut est « envie »", () => {
  expect(view(null)).toContain('value="envie"');
});

test("critère 3 : la règle enfreinte est affichée et la saisie du nom est conservée", () => {
  const html = view("Le nom est obligatoire.", { ...emptyValues, name: "  " });
  expect(html).toContain("Le nom est obligatoire.");
  expect(html).toContain('value="  "');
});

test("lot 2, critère 2 : après un refus, toute la saisie est conservée", () => {
  const html = view("Renseigne le nombre de joueurs min et max ensemble, ou aucun des deux.", {
    name: "Catan",
    status: "possede",
    minPlayers: "2",
    maxPlayers: "",
    duration: "45",
    minAge: "8",
    publisher: "Kosmos",
    notes: "Une note",
  });
  for (const v of ['value="Catan"', 'value="2"', 'value="45"', 'value="8"', 'value="Kosmos"', 'value="Une note"', 'value="possede"']) {
    expect(html).toContain(v);
  }
  expect(html).toContain("min et max ensemble");
});

test("accessibilité : seul le champ fautif est signalé invalide et relié au message", () => {
  const html = view("La durée doit être un entier supérieur à 0 (en minutes).", { ...emptyValues, name: "Catan", duration: "abc" }, ["duration"]);
  expect(invalidCount(html)).toBe(1);
  expect(html).toMatch(/id="duration"[^>]*aria-invalid="true"|aria-invalid="true"[^>]*id="duration"/);
  expect(html).toContain('aria-describedby="form-error"');
  expect(html).toContain('id="form-error"');
});

test("accessibilité : deux champs fautifs (joueurs min et max) sont tous deux signalés", () => {
  expect(invalidCount(view("Renseigne le nombre de joueurs min et max ensemble, ou aucun des deux.", emptyValues, ["minPlayers", "maxPlayers"]))).toBe(2);
});

test("accessibilité : sans erreur, aucun champ n'est signalé invalide", () => {
  expect(invalidCount(view(null))).toBe(0);
});
