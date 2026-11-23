import { describe, expect, test, vi } from "vitest";
import { addGame, cleanName, DuplicateGameError, listGames, normalizeKey, queryGames, removeGame, updateGame, type Game, type GameRepository } from "./games";

// Faux dépôt : même contrat que les vrais (clé unique → DuplicateGameError, absent → null / false), espionné pour vérifier les appels.
// Le service n'a pas le droit d'importer src/data, même en test : le vrai dépôt mémoire est couvert par la suite de contrat.
function fakeRepo(initial: Game[] = []) {
  const rows = initial.map((game) => ({ game, key: normalizeKey(game.name) }));
  const taken = (key: string, except?: string) => rows.some((r) => r.key === key && r.game.id !== except);
  const repo: GameRepository = {
    list: async () => rows.map((r) => r.game),
    create: vi.fn(async ({ key, ...rest }) => {
      if (taken(key)) throw new DuplicateGameError();
      const game = { id: crypto.randomUUID(), ...rest };
      rows.push({ game, key });
      return game;
    }),
    update: vi.fn(async (id, { key, ...rest }) => {
      const row = rows.find((r) => r.game.id === id);
      if (!row) return null;
      if (taken(key, id)) throw new DuplicateGameError();
      row.game = { id, ...rest };
      row.key = key;
      return row.game;
    }),
    remove: vi.fn(async (id) => {
      const i = rows.findIndex((r) => r.game.id === id);
      if (i < 0) return false;
      rows.splice(i, 1);
      return true;
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
    expect(await repo.list()).toHaveLength(1);
  });

  test("critère 4 : deux ajouts simultanés, le dépôt refuse le second → doublon, pas d'exception", async () => {
    const repo: GameRepository = {
      list: async () => [],
      create: async () => {
        throw new DuplicateGameError();
      },
      update: async () => null,
      remove: async () => false,
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
    expect((await repo.list()).map((g) => g.name)).toEqual(["Catan", "Azul"]);
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
    expect(await repo.list()).toEqual([catan]);
  });

  test("deux modifications simultanées vers le même nom : le dépôt refuse la seconde → doublon, pas d'exception", async () => {
    const repo = fakeRepo([catan, azul]);
    repo.update = async () => {
      throw new DuplicateGameError();
    };
    expect(await updateGame(repo, "2", { name: "Colons" })).toMatchObject({ ok: false, error: { rule: "name-duplicate" } });
  });
});

describe("removeGame · lot 4 : supprimer un jeu", () => {
  test("critère 2 : le jeu supprimé disparaît de la liste", async () => {
    const repo = fakeRepo([game("1", "Catan"), game("2", "Azul")]);
    expect(await removeGame(repo, "1")).toEqual({ ok: true });
    expect((await listGames(repo)).map((g) => g.name)).toEqual(["Azul"]);
    expect(repo.remove).toHaveBeenCalledWith("1");
  });

  test("jeu introuvable (déjà supprimé ailleurs) → erreur « game-not-found », pas d'exception", async () => {
    const repo = fakeRepo([game("1", "Catan")]);
    expect(await removeGame(repo, "99")).toMatchObject({ ok: false, error: { rule: "game-not-found", message: expect.stringMatching(/n'existe plus/) } });
    expect(await listGames(repo)).toHaveLength(1);
  });
});

describe("recherche · lot 5 : listGames filtré par nom", () => {
  const base = () => fakeRepo([game("1", "Catan"), game("2", "Azul"), game("3", "Les Colons")]);
  const names = async (repo: GameRepository, q?: string) => (await listGames(repo, { q })).map((g) => g.name);

  test("critère 1 : « an » → Catan", async () => {
    expect(await names(base(), "an")).toEqual(["Catan"]);
  });

  test("le nom contient le texte, pas seulement au début", async () => {
    expect(await names(base(), "colo")).toEqual(["Les Colons"]);
    expect(await names(base(), "zul")).toEqual(["Azul"]);
  });

  test.each(["elan", "ÉLAN", "  Élan "])("critère 2 : %j trouve « Élan » (sans casse ni accents)", async (q) => {
    expect(await names(fakeRepo([game("1", "Élan"), game("2", "Azul")]), q)).toEqual(["Élan"]);
  });

  test.each([undefined, "", "   "])("critère 3 : recherche vide (%j) → tous les jeux, triés", async (q) => {
    expect(await names(base(), q)).toEqual(["Azul", "Catan", "Les Colons"]);
  });

  test("critère 4 : recherche sans résultat → liste vide", async () => {
    expect(await names(base(), "zzz")).toEqual([]);
  });

  test("les espaces multiples de la recherche sont réduits comme ceux des noms", async () => {
    expect(await names(base(), "les    colons")).toEqual(["Les Colons"]);
  });

  test("critère 5 : après ajout, modification, suppression, la même recherche reste appliquée", async () => {
    const repo = fakeRepo([game("1", "Catan")]);
    const catane = await addGame(repo, { name: "Catane" });
    await addGame(repo, { name: "Azul" });
    expect(await names(repo, "an")).toEqual(["Catan", "Catane"]);
    await updateGame(repo, "1", { name: "Colons" });
    expect(await names(repo, "an")).toEqual(["Catane"]);
    if (catane.ok) await removeGame(repo, catane.game.id);
    expect(await names(repo, "an")).toEqual([]);
  });
});

describe("filtres · lot 6 : queryGames (recherche + statut + joueurs + durée)", () => {
  const catan: Game = { id: "1", name: "Catan", status: "possede", minPlayers: 3, maxPlayers: 4, duration: 60 };
  const azul: Game = { id: "2", name: "Azul", status: "envie", minPlayers: 2, maxPlayers: 4, duration: 45 };
  const nu: Game = { id: "3", name: "Mystère", status: "envie" }; // ni joueurs ni durée
  const repo = () => fakeRepo([catan, azul, nu]);
  const names = async (raw: Parameters<typeof queryGames>[1]) => {
    const result = await queryGames(repo(), raw);
    if (!result.ok) throw new Error(`refusé : ${result.error.rule}`);
    return result.games.map((g) => g.name);
  };

  test("critère 5 : sans filtre (état à l'ouverture), tous les jeux, triés", async () => {
    expect(await names({})).toEqual(["Azul", "Catan", "Mystère"]);
    expect(await names({ status: "tous", players: "", duration: "", q: "" })).toEqual(["Azul", "Catan", "Mystère"]);
  });

  test.each([
    ["possede", ["Catan"]],
    ["envie", ["Azul", "Mystère"]],
    ["tous", ["Azul", "Catan", "Mystère"]],
  ])("critère 1 : statut %s", async (status, expected) => {
    expect(await names({ status })).toEqual(expected);
  });

  test.each([
    ["4", ["Azul", "Catan"]],
    ["5", []],
    ["2", ["Azul"]],
    ["3", ["Azul", "Catan"]],
    ["1", []],
  ])("critère 2 : N = %s joueurs (min ≤ N ≤ max)", async (players, expected) => {
    expect(await names({ players })).toEqual(expected);
  });

  test.each([
    ["45", ["Azul"]],
    ["30", []],
    ["60", ["Azul", "Catan"]],
    ["90", ["Azul", "Catan"]],
  ])("critère 3 : durée X = %s min (durée ≤ X)", async (duration, expected) => {
    expect(await names({ duration })).toEqual(expected);
  });

  test("critère 4 : un jeu sans joueurs ou sans durée est masqué quand le filtre correspondant est actif", async () => {
    expect(await names({ players: "2" })).not.toContain("Mystère");
    expect(await names({ duration: "120" })).not.toContain("Mystère");
    expect(await names({ status: "envie" })).toContain("Mystère"); // filtre statut seul : pas masqué
  });

  test("les filtres se cumulent entre eux et avec la recherche", async () => {
    expect(await names({ status: "envie", players: "3" })).toEqual(["Azul"]);
    expect(await names({ q: "a", players: "4", duration: "60" })).toEqual(["Azul", "Catan"]);
    expect(await names({ q: "cat", status: "envie" })).toEqual([]);
    expect(await names({ q: "AZUL", status: "envie", players: "2", duration: "45" })).toEqual(["Azul"]);
  });

  test.each([
    [{ players: "0" }, "players-filter-integer", ["players"]],
    [{ players: "-2" }, "players-filter-integer", ["players"]],
    [{ players: "2.5" }, "players-filter-integer", ["players"]],
    [{ players: "abc" }, "players-filter-integer", ["players"]],
    [{ duration: "0" }, "duration-filter-integer", ["duration"]],
    [{ duration: "-30" }, "duration-filter-integer", ["duration"]],
    [{ duration: "1.5" }, "duration-filter-integer", ["duration"]],
    [{ duration: "xx" }, "duration-filter-integer", ["duration"]],
    [{ status: "perdu" }, "status-filter-invalid", ["status"]],
  ])("critère 5 : %j refusé (%s)", async (raw, rule, fields) => {
    const result = await queryGames(repo(), raw);
    expect(result).toMatchObject({ ok: false, error: { rule, fields } });
    if (!result.ok) expect(result.error.message.length).toBeGreaterThan(10);
  });

  test("les espaces autour d'un nombre sont ignorés, vide ou espaces = filtre inactif", async () => {
    expect(await names({ players: " 4 " })).toEqual(["Azul", "Catan"]);
    expect(await names({ players: "  ", duration: " " })).toEqual(["Azul", "Catan", "Mystère"]);
  });

  test("le message d'un statut refusé ne conseille pas de valeur (la valeur attendue est « possede », pas « possédé »)", async () => {
    const result = await queryGames(repo(), { status: "possédé" });
    expect(result).toMatchObject({ ok: false, error: { rule: "status-filter-invalid" } });
    if (!result.ok) expect(result.error.message).not.toMatch(/possédé|envie|«/);
  });
});
