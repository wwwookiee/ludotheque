import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "vitest";

const read = (p: string) => readFileSync(p, "utf8");

test("chaque composant de ui/ figure sur /design-system", () => {
  const page = read("src/app/design-system/page.tsx");
  const absents = readdirSync("src/components/ui")
    .filter((f) => f.endsWith(".tsx"))
    .map((f) => f.replace(".tsx", ""))
    .filter((n) => !page.includes(`ui/${n}"`));
  expect(absents).toEqual([]);
});

test("chaque jeton du thème clair existe aussi en sombre", () => {
  const css = read("src/app/globals.css");
  const tokens = (start: string) => {
    const block = css.slice(css.indexOf(start)).split("\n}")[0];
    return [...block.matchAll(/^\s+(--[\w-]+):/gm)].map((m) => m[1]).sort();
  };
  const light = tokens(":root {");
  const dark = tokens(".dark {");
  // --radius est commun aux deux modes : défini une seule fois.
  expect(light.filter((t) => t !== "--radius")).toEqual(dark);
});
