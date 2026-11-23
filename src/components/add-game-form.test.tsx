import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { AddGameFormView } from "./add-game-form";
import { emptyValues } from "./add-game-values";

const noop = () => {};
const view = (error: string | null, values = emptyValues) =>
  renderToString(<AddGameFormView state={{ error, values }} action={noop} pending={false} />);

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
