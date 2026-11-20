import { expect, test } from "vitest";
import { listGames } from "./games";

test("listGames délègue au dépôt", async () => {
  const games = [{ id: "1", name: "Catan" }];
  expect(await listGames({ list: async () => games })).toEqual(games);
});
