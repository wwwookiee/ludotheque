import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import type { Game } from "@/services/games";
import { emptyValues } from "./add-game-values";
import { GameItemView } from "./game-item";

const noop = () => {};
const catan: Game = { id: "g1", name: "Catan", status: "envie", minPlayers: 3, maxPlayers: 4, duration: 60, publisher: "Kosmos", notes: "Une note" };
const props = { game: catan, editState: { error: null, fields: [], values: emptyValues }, editAction: noop, pending: false, onEdit: noop, onCancel: noop };

test("lot 3 : en consultation, le jeu a un bouton « Modifier » et ses détails", () => {
  const html = renderToString(<GameItemView {...props} mode="view" />);
  expect(html).toContain("Modifier");
  expect(html).toContain("3–4 joueurs · 60 min · Kosmos");
  expect(html).not.toContain("<form");
});

test("lot 3 : en modification, le formulaire est prérempli dans la liste, avec des ids propres au jeu", () => {
  const html = renderToString(<GameItemView {...props} mode="edit" editState={{ error: null, fields: [], values: { ...emptyValues, name: "Catan", minPlayers: "3", maxPlayers: "4", duration: "60", publisher: "Kosmos", notes: "Une note" } }} />);
  expect(html).toContain("<form");
  for (const v of ['id="edit-g1-name"', 'value="Catan"', 'value="3"', 'value="60"', 'value="Kosmos"', "Enregistrer", "Annuler"]) expect(html).toContain(v);
});

test("lot 3, critère 2 : un refus affiche le message et le champ nom est signalé", () => {
  const html = renderToString(<GameItemView {...props} mode="edit" editState={{ error: "Un jeu porte déjà ce nom.", fields: ["name"], values: { ...emptyValues, name: "Catan" } }} />);
  expect(html).toContain("Un jeu porte déjà ce nom.");
  expect(html).toMatch(/id="edit-g1-name"[^>]*aria-invalid="true"|aria-invalid="true"[^>]*id="edit-g1-name"/);
  expect(html).toContain('id="edit-g1-form-error"');
});
