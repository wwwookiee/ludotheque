import { expect, test } from "vitest";
import { cn } from "./utils";

test("cn : la dernière classe Tailwind gagne, les valeurs conditionnelles sont gérées", () => {
  expect(cn("p-4", "p-3")).toBe("p-3");
  expect(cn("a", false && "b", { c: true, d: false }, ["e"])).toBe("a c e");
});
