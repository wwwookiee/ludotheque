"use server";

import { revalidatePath } from "next/cache";
import type { AddGameState } from "@/components/add-game-form";
import { games } from "@/container";

export async function addGameAction(_prev: AddGameState, formData: FormData): Promise<AddGameState> {
  const name = String(formData.get("name") ?? "");
  const result = await games.add({ name });
  if (!result.ok) return { error: result.error.message, name };
  revalidatePath("/");
  return { error: null, name: "" };
}
