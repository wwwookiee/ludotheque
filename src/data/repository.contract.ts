import { describe, expect, test } from "vitest";
import { DuplicateGameError, type GameRepository } from "@/services/games";

// Suite commune : chaque implémentation de GameRepository doit la passer.
export function describeRepositoryContract(name: string, make: () => GameRepository | Promise<GameRepository>) {
  describe(`contrat GameRepository · ${name}`, () => {
    test("la liste est vide au départ", async () => {
      expect(await (await make()).list()).toEqual([]);
    });

    test("create renvoie le jeu avec un id", async () => {
      const game = await (await make()).create({ name: "Catan", key: "catan", status: "envie" });
      expect(game).toMatchObject({ name: "Catan", status: "envie" });
      expect(game.id).toBeTruthy();
    });

    test("list renvoie les jeux créés, avec des ids différents", async () => {
      const repo = await make();
      const a = await repo.create({ name: "Catan", key: "catan", status: "envie" });
      const b = await repo.create({ name: "Azul", key: "azul", status: "possede" });
      expect(a.id).not.toBe(b.id);
      expect((await repo.list()).sort((x, y) => x.name.localeCompare(y.name))).toEqual([b, a]);
    });

    test("lot 2 : tous les détails font l'aller-retour, create et list", async () => {
      const repo = await make();
      const full = { name: "Catan", key: "catan", status: "possede" as const, minPlayers: 2, maxPlayers: 4, duration: 45, minAge: 8, publisher: "Kosmos", notes: "Note" };
      const created = await repo.create(full);
      expect(created).toMatchObject({ minPlayers: 2, maxPlayers: 4, duration: 45, minAge: 8, publisher: "Kosmos", notes: "Note", status: "possede" });
      expect(await repo.list()).toEqual([created]);
    });

    test("lot 2 : un jeu sans détail n'a aucun détail", async () => {
      const repo = await make();
      await repo.create({ name: "Azul", key: "azul", status: "envie" });
      expect(Object.keys((await repo.list())[0]).sort()).toEqual(["id", "name", "status"]);
    });

    test("refuse une clé déjà prise avec DuplicateGameError, sans rien stocker", async () => {
      const repo = await make();
      await repo.create({ name: "Catan", key: "catan", status: "envie" });
      await expect(repo.create({ name: "Cätan", key: "catan", status: "envie" })).rejects.toBeInstanceOf(DuplicateGameError);
      expect(await repo.list()).toHaveLength(1);
    });

    test("lot 3 : update remplace tous les champs et la liste le reflète", async () => {
      const repo = await make();
      const { id } = await repo.create({ name: "Catan", key: "catan", status: "envie", duration: 45, publisher: "Kosmos" });
      const updated = await repo.update(id, { name: "Les Colons", key: "les colons", status: "possede", minPlayers: 3, maxPlayers: 4 });
      expect(updated).toEqual({ id, name: "Les Colons", status: "possede", minPlayers: 3, maxPlayers: 4 });
      expect(await repo.list()).toEqual([updated]);
    });

    test("lot 3 : update garde sa propre clé (le jeu ne se compare pas à lui-même)", async () => {
      const repo = await make();
      const { id } = await repo.create({ name: "Catan", key: "catan", status: "envie" });
      expect(await repo.update(id, { name: "CATAN", key: "catan", status: "possede" })).toMatchObject({ name: "CATAN", status: "possede" });
    });

    test("lot 3 : update d'un id inconnu renvoie null et ne crée rien", async () => {
      const repo = await make();
      expect(await repo.update("inconnu", { name: "X", key: "x", status: "envie" })).toBeNull();
      expect(await repo.list()).toEqual([]);
    });

    test("lot 3 : update vers la clé d'un autre jeu → DuplicateGameError, jeux inchangés", async () => {
      const repo = await make();
      await repo.create({ name: "Catan", key: "catan", status: "envie" });
      const azul = await repo.create({ name: "Azul", key: "azul", status: "envie" });
      await expect(repo.update(azul.id, { name: "Catan", key: "catan", status: "envie" })).rejects.toBeInstanceOf(DuplicateGameError);
      expect((await repo.list()).map((g) => g.name).sort()).toEqual(["Azul", "Catan"]);
    });

    test("refuse un statut inconnu", async () => {
      const repo = await make();
      await expect(repo.create({ name: "X", key: "x", status: "nope" as never })).rejects.toThrow();
    });
  });
}
