import { describe, expect, test } from "vitest";
import type { GameRepository } from "@/services/games";

// Suite commune : chaque implémentation de GameRepository doit la passer.
export function describeRepositoryContract(name: string, make: () => GameRepository | Promise<GameRepository>) {
  describe(`contrat GameRepository · ${name}`, () => {
    test("la liste est vide au départ", async () => {
      expect(await (await make()).list()).toEqual([]);
    });

    test("create renvoie le jeu avec un id", async () => {
      const game = await (await make()).create({ name: "Catan", status: "envie" });
      expect(game).toMatchObject({ name: "Catan", status: "envie" });
      expect(game.id).toBeTruthy();
    });

    test("list renvoie les jeux créés, avec des ids différents", async () => {
      const repo = await make();
      const a = await repo.create({ name: "Catan", status: "envie" });
      const b = await repo.create({ name: "Azul", status: "possede" });
      expect(a.id).not.toBe(b.id);
      expect((await repo.list()).sort((x, y) => x.name.localeCompare(y.name))).toEqual([b, a]);
    });

    test("refuse un statut inconnu", async () => {
      const repo = await make();
      await expect(repo.create({ name: "X", status: "nope" as never })).rejects.toThrow();
    });
  });
}
