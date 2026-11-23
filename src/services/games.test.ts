import { describe, expect, test, vi } from "vitest";
import { addGame, cleanName, DuplicateGameError, listGames, normalizeKey, updateGame, type Game, type GameRepository } from "./games";

function fakeRepo(initial: Game[] = []) {
  const games = [...initial];
  const repo: GameRepository = {
    list: async () => [...games],
    create: vi.fn(async (g) => {
      const { key, ...rest } = g;
      void key;
      const game = { id: String(games.length + 1), ...rest };
      games.push(game);
      return game;
    }),
    update: vi.fn(async (id, g) => {
      const i = games.findIndex((x) => x.id === id);
      if (i < 0) return null;
      const { key, ...rest } = g;
      void key;
      games[i] = { id, ...rest };
      return games[i];
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
      update: async () => null,
    };
    expect(await addGame(repo, { name: "Catan" })).toMatchObject({ ok: false, error: { rule: "name-duplicate" } });
  });
});

describe("addGame · lot 2 : détails du jeu", () => {
  test("critère 1 : joueurs 2–4, durée 45, âge 8, éditeur et notes nettoyés, sont enregistrés", async () => {
    const repo = fakeRepo();
    const result = await addGame(repo, {
      name: "Catan",
      minPlayers: "2",
      maxPlayers: "4",
      duration: "45",
      minAge: "8",
      publisher: " Kosmos ",
      notes: " Extension à acheter ",
    });
    expect(result).toMatchObject({
      ok: true,
      game: { minPlayers: 2, maxPlayers: 4, duration: 45, minAge: 8, publisher: "Kosmos", notes: "Extension à acheter" },
    });
  });

  test.each([{ minPlayers: "2" }, { maxPlayers: "4" }, { minPlayers: "2", maxPlayers: "  " }])(
    "critère 2 : %j → min ou max seul refusé (players-pair)",
    async (input) => {
      const repo = fakeRepo();
      const result = await addGame(repo, { name: "Catan", ...input });
      expect(result).toMatchObject({ ok: false, error: { rule: "players-pair" } });
      if (!result.ok) expect(result.error.message).toMatch(/min et max/);
      expect(repo.create).not.toHaveBeenCalled();
    },
  );

  test.each([
    [{ minPlayers: "5", maxPlayers: "3" }, "players-min-max"],
    [{ minPlayers: "0", maxPlayers: "3" }, "players-positive-integer"],
    [{ minPlayers: "2", maxPlayers: "0" }, "players-positive-integer"],
    [{ minPlayers: "-1", maxPlayers: "3" }, "players-positive-integer"],
    [{ minPlayers: "2.5", maxPlayers: "3" }, "players-positive-integer"],
    [{ minPlayers: "abc", maxPlayers: "3" }, "players-positive-integer"],
    [{ duration: "0" }, "duration-positive-integer"],
    [{ duration: "-5" }, "duration-positive-integer"],
    [{ duration: "1.5" }, "duration-positive-integer"],
    [{ duration: "abc" }, "duration-positive-integer"],
    [{ minAge: "0" }, "age-positive-integer"],
    [{ minAge: "-8" }, "age-positive-integer"],
    [{ minAge: "7.5" }, "age-positive-integer"],
    [{ minAge: "huit" }, "age-positive-integer"],
    [{ status: "nope" }, "status-invalid"],
  ])("critère 3 : %j refusé avec la règle %s", async (input, rule) => {
    const repo = fakeRepo();
    const result = await addGame(repo, { name: "Catan", ...input });
    expect(result).toMatchObject({ ok: false, error: { rule } });
    if (!result.ok) expect(result.error.message.length).toBeGreaterThan(10);
    expect(repo.create).not.toHaveBeenCalled();
  });

  test("bornes : min = max et la valeur 1 sont acceptés", async () => {
    const result = await addGame(fakeRepo(), { name: "Solo", minPlayers: "1", maxPlayers: "1", duration: "1", minAge: "1" });
    expect(result).toMatchObject({ ok: true, game: { minPlayers: 1, maxPlayers: 1, duration: 1, minAge: 1 } });
  });

  test("critère 4 : tout vide (ou espaces) → enregistré sans aucun détail", async () => {
    const repo = fakeRepo();
    const result = await addGame(repo, {
      name: "Azul",
      minPlayers: "",
      maxPlayers: " ",
      duration: "",
      minAge: "",
      publisher: "  ",
      notes: "",
    });
    expect(result).toMatchObject({ ok: true, game: { name: "Azul", status: "envie" } });
    expect(repo.create).toHaveBeenCalledWith({ name: "Azul", key: "azul", status: "envie" });
    if (result.ok) expect(Object.keys(result.game).sort()).toEqual(["id", "name", "status"]);
  });

  test("critère 5 : statut « possédé » choisi → enregistré avec ce statut", async () => {
    const result = await addGame(fakeRepo(), { name: "Catan", status: "possede" });
    expect(result).toMatchObject({ ok: true, game: { status: "possede" } });
  });
});

describe("addGame · champs fautifs (pour que la présentation signale le bon champ)", () => {
  test.each([
    [{ name: "  " }, "name-required", ["name"]],
    [{ name: "Catan", status: "nope" }, "status-invalid", ["status"]],
    [{ name: "Catan", minPlayers: "2" }, "players-pair", ["minPlayers", "maxPlayers"]],
    [{ name: "Catan", minPlayers: "5", maxPlayers: "3" }, "players-min-max", ["minPlayers", "maxPlayers"]],
    [{ name: "Catan", minPlayers: "0", maxPlayers: "3" }, "players-positive-integer", ["minPlayers", "maxPlayers"]],
    [{ name: "Catan", duration: "abc" }, "duration-positive-integer", ["duration"]],
    [{ name: "Catan", minAge: "0" }, "age-positive-integer", ["minAge"]],
  ])("%j → règle %s sur %j", async (input, rule, fields) => {
    expect(await addGame(fakeRepo(), input)).toMatchObject({ ok: false, error: { rule, fields } });
  });

  test("un doublon désigne le champ nom", async () => {
    expect(await addGame(fakeRepo([game("1", "Catan")]), { name: "catan" })).toMatchObject({ ok: false, error: { rule: "name-duplicate", fields: ["name"] } });
  });
});

describe("updateGame · lot 3 : modifier un jeu, mêmes règles que l'ajout", () => {
  const catan = { id: "1", name: "Catan", status: "envie" as const };
  const azul = { id: "2", name: "Azul", status: "envie" as const };

  test("critère 1 : « envie » → « possédé » est enregistré", async () => {
    const repo = fakeRepo([catan, azul]);
    const result = await updateGame(repo, "1", { name: "Catan", status: "possede" });
    expect(result).toMatchObject({ ok: true, game: { id: "1", name: "Catan", status: "possede" } });
    expect(repo.update).toHaveBeenCalledWith("1", { name: "Catan", key: "catan", status: "possede" });
  });

  test("critère 2 : renommer Azul en « Catan » est refusé (doublon), sur le champ nom", async () => {
    const repo = fakeRepo([catan, azul]);
    const result = await updateGame(repo, "2", { name: "Catan" });
    expect(result).toMatchObject({ ok: false, error: { rule: "name-duplicate", fields: ["name"] } });
    expect(repo.update).not.toHaveBeenCalled();
  });

  test.each(["Catan", "CATAN", "  cätan "])("critère 3 : garder le même nom (%j) est accepté, le jeu ne se compare pas à lui-même", async (name) => {
    const result = await updateGame(fakeRepo([catan, azul]), "1", { name });
    expect(result).toMatchObject({ ok: true });
  });

  test("critère 4 : min 5 > max 3 est refusé avec la règle, rien n'est modifié", async () => {
    const repo = fakeRepo([catan]);
    const result = await updateGame(repo, "1", { name: "Catan", minPlayers: "5", maxPlayers: "3" });
    expect(result).toMatchObject({ ok: false, error: { rule: "players-min-max" } });
    expect(repo.update).not.toHaveBeenCalled();
  });

  test("les autres règles de l'ajout s'appliquent aussi (nom vide, durée invalide)", async () => {
    const repo = fakeRepo([catan]);
    expect(await updateGame(repo, "1", { name: "  " })).toMatchObject({ ok: false, error: { rule: "name-required" } });
    expect(await updateGame(repo, "1", { name: "Catan", duration: "0" })).toMatchObject({ ok: false, error: { rule: "duration-positive-integer" } });
  });

  test("un détail vidé est retiré du jeu", async () => {
    const repo = fakeRepo([{ ...catan, duration: 45, publisher: "Kosmos" }]);
    const result = await updateGame(repo, "1", { name: "Catan", duration: "", publisher: " " });
    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(Object.keys(result.game).sort()).toEqual(["id", "name", "status"]);
  });

  test("jeu introuvable → erreur « game-not-found », rien n'est écrit", async () => {
    const repo = fakeRepo([catan]);
    expect(await updateGame(repo, "99", { name: "Azul" })).toMatchObject({ ok: false, error: { rule: "game-not-found" } });
    expect(repo.update).not.toHaveBeenCalled();
  });

  test("deux modifications simultanées vers le même nom : le dépôt refuse la seconde → doublon, pas d'exception", async () => {
    const repo = fakeRepo([catan, azul]);
    repo.update = async () => {
      throw new DuplicateGameError();
    };
    expect(await updateGame(repo, "2", { name: "Colons" })).toMatchObject({ ok: false, error: { rule: "name-duplicate" } });
  });
});
