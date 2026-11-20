import { expect, test } from "vitest";
import { createMemoryRepository } from "./memory-repository";

test("le dépôt mémoire est vide", async () => {
  expect(await createMemoryRepository().list()).toEqual([]);
});
