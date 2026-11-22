import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { AddGameFormView } from "./add-game-form";

const noop = () => {};

test("formulaire neuf : champ vide, aucun message d'erreur", () => {
  const html = renderToString(<AddGameFormView state={{ error: null, name: "" }} action={noop} pending={false} />);
  expect(html).toContain('name="name"');
  expect(html).not.toContain('role="alert"');
});

test("critère 3 : la règle enfreinte est affichée et la saisie est conservée", () => {
  const html = renderToString(
    <AddGameFormView state={{ error: "Le nom est obligatoire.", name: "  " }} action={noop} pending={false} />,
  );
  expect(html).toContain("Le nom est obligatoire.");
  expect(html).toContain('value="  "');
});
