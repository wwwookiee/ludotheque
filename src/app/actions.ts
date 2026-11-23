"use server";

import { revalidatePath } from "next/cache";
import { emptyValues, type AddGameState, type AddGameValues } from "@/components/add-game-values";
import { games } from "@/container";

export async function addGameAction(_prev: AddGameState, formData: FormData): Promise<AddGameState> {
  const values = Object.fromEntries(Object.keys(emptyValues).map((k) => [k, String(formData.get(k) ?? "")])) as AddGameValues;
  const result = await games.add(values);
  if (!result.ok) return { error: result.error.message, values };
  revalidatePath("/");
  return { error: null, values: emptyValues };
}
