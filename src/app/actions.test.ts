import { beforeEach, expect, test, vi } from "vitest";

const { revalidatePath, remove, update } = vi.hoisted(() => ({ revalidatePath: vi.fn(), remove: vi.fn(), update: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/container", () => ({ games: { remove, update, add: vi.fn() } }));

import { deleteGameAction, updateGameAction } from "./actions";

const notFound = { ok: false, error: { rule: "game-not-found", message: "Ce jeu n'existe plus.", fields: [] } };
const prev = { error: null, fields: [], values: { name: "", status: "envie", minPlayers: "", maxPlayers: "", duration: "", minAge: "", publisher: "", notes: "" } };
const form = (name: string) => {
  const f = new FormData();
  f.set("name", name);
  return f;
};

beforeEach(() => vi.clearAllMocks());

test("suppression d'un jeu déjà supprimé ailleurs : le message est renvoyé et la liste est rafraîchie", async () => {
  remove.mockResolvedValue(notFound);
  expect(await deleteGameAction("1")).toEqual({ error: "Ce jeu n'existe plus." });
  expect(revalidatePath).toHaveBeenCalledWith("/");
});

test("modification d'un jeu supprimé ailleurs : le message est renvoyé et la liste est rafraîchie", async () => {
  update.mockResolvedValue(notFound);
  expect(await updateGameAction("1", prev, form("Catan"))).toMatchObject({ error: "Ce jeu n'existe plus." });
  expect(revalidatePath).toHaveBeenCalledWith("/");
});

test("une simple saisie refusée ne rafraîchit pas la liste", async () => {
  update.mockResolvedValue({ ok: false, error: { rule: "name-required", message: "Le nom est obligatoire.", fields: ["name"] } });
  await updateGameAction("1", prev, form(""));
  expect(revalidatePath).not.toHaveBeenCalled();
});

test("suppression réussie : la liste est rafraîchie", async () => {
  remove.mockResolvedValue({ ok: true });
  expect(await deleteGameAction("1")).toEqual({ error: null });
  expect(revalidatePath).toHaveBeenCalledWith("/");
});
