import { createClient } from "@libsql/client";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { createLibsqlRepository } from "./libsql-repository";
import { describeRepositoryContract } from "./repository.contract";

describeRepositoryContract("libSQL", () => createLibsqlRepository(createClient({ url: ":memory:" })));

test("critère 5 : les jeux sont toujours là après réouverture de la base", async () => {
  const file = join(tmpdir(), `ludotheque-test-${process.pid}-${Date.now()}.db`);
  const url = `file:${file}`;
  try {
    const first = createClient({ url });
    await createLibsqlRepository(first).create({ name: "Catan", key: "catan", status: "envie" });
    first.close();

    const second = createClient({ url });
    expect((await createLibsqlRepository(second).list()).map((g) => g.name)).toEqual(["Catan"]);
    second.close();
  } finally {
    rmSync(file, { force: true });
  }
});

test("l'échec de création de la table n'est pas mis en cache : la requête suivante réessaie", async () => {
  const real = createClient({ url: ":memory:" });
  let calls = 0;
  const flaky = new Proxy(real, {
    get: (t, p) =>
      p === "execute"
        ? (...a: Parameters<typeof real.execute>) => (calls++ === 0 ? Promise.reject(new Error("réseau")) : t.execute(...a))
        : Reflect.get(t, p),
  });
  const repo = createLibsqlRepository(flaky);
  await expect(repo.list()).rejects.toThrow("réseau");
  expect(await repo.list()).toEqual([]);
});

test("rien n'est exécuté à la création du dépôt (pas de rejet non géré à l'import)", () => {
  const real = createClient({ url: ":memory:" });
  let calls = 0;
  createLibsqlRepository(new Proxy(real, { get: (t, p) => (p === "execute" ? () => (calls++, Promise.reject(new Error("x"))) : Reflect.get(t, p)) }));
  expect(calls).toBe(0);
});
