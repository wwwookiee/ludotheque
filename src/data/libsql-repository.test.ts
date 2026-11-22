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
    await createLibsqlRepository(first).create({ name: "Catan", status: "envie" });
    first.close();

    const second = createClient({ url });
    expect((await createLibsqlRepository(second).list()).map((g) => g.name)).toEqual(["Catan"]);
    second.close();
  } finally {
    rmSync(file, { force: true });
  }
});
