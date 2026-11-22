import { describe, expect, test, vi } from "vitest";
import { addGame, cleanName, DuplicateGameError, listGames, normalizeKey, type Game, type GameRepository } from "./games";

function fakeRepo(initial: Game[] = []) {
  const games = [...initial];
  const repo: GameRepository = {
    list: async () => [...games],
    create: vi.fn(async (g) => {
      const game = { id: String(games.length + 1), name: g.name, status: g.status };
      games.push(game);
      return game;
    }),
  };
  return repo;
}
const game = (id: string, name: string): Game => ({ id, name, status: "envie" });

describe("normalisation", () => {
  test("cleanName : espaces en début/fin retirés, espaces multiples réduits", () => {
    expect(cleanName("  Les   Colons ")).toBe("Les Colons");
  });
  test("normalizeKey : sans casse, sans accents, sans espaces superflus", () => {
    expect(normalizeKey(" Cätan ")).toBe("catan");
    expect(normalizeKey("ÉLAN")).toBe("elan");
  });
});

describe("listGames · critère 1 : tri par nom, sans casse ni accents", () => {
  test("Catan, élan, Azul → Azul, Catan, élan", async () => {
    const repo = fakeRepo([game("1", "Catan"), game("2", "élan"), game("3", "Azul")]);
    expect((await listGames(repo)).map((g) => g.name)).toEqual(["Azul", "Catan", "élan"]);
  });
});

describe("addGame", () => {
  test("critère 2 : nom nettoyé, statut « envie » par défaut", async () => {
    const repo = fakeRepo();
    const result = await addGame(repo, { name: "  Les   Colons " });
    expect(result).toMatchObject({ ok: true, game: { name: "Les Colons", status: "envie" } });
    expect(repo.create).toHaveBeenCalledWith({ name: "Les Colons", key: "les colons", status: "envie" });
  });

  test.each(["", "   "])("critère 3 : nom vide (%j) refusé, règle nommée", async (name) => {
    const repo = fakeRepo();
    const result = await addGame(repo, { name });
    expect(result).toMatchObject({ ok: false, error: { rule: "name-required" } });
    if (!result.ok) expect(result.error.message).toMatch(/obligatoire/);
    expect(repo.create).not.toHaveBeenCalled();
  });

  test.each(["catan", "Cätan", "  CATAN "])("critère 4 : doublon %j refusé", async (name) => {
    const repo = fakeRepo([game("1", "Catan")]);
    const result = await addGame(repo, { name });
    expect(result).toMatchObject({ ok: false, error: { rule: "name-duplicate" } });
    if (!result.ok) expect(result.error.message).toMatch(/déjà/);
    expect(repo.create).not.toHaveBeenCalled();
  });

  test("critère 4 : deux ajouts simultanés, le dépôt refuse le second → doublon, pas d'exception", async () => {
    const repo: GameRepository = {
      list: async () => [],
      create: async () => {
        throw new DuplicateGameError();
      },
    };
    expect(await addGame(repo, { name: "Catan" })).toMatchObject({ ok: false, error: { rule: "name-duplicate" } });
  });
});
