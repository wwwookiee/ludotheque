"use server";

import { revalidatePath } from "next/cache";
import { emptyValues, type AddGameState, type AddGameValues, type DeleteState } from "@/components/add-game-values";
import { games } from "@/container";

// Saisie brute du formulaire : que du texte, le service valide et convertit.
const readValues = (formData: FormData) =>
  Object.fromEntries(Object.keys(emptyValues).map((k) => [k, String(formData.get(k) ?? "")])) as AddGameValues;

export async function addGameAction(_prev: AddGameState, formData: FormData): Promise<AddGameState> {
  const values = readValues(formData);
  const result = await games.add(values);
  if (!result.ok) return { error: result.error.message, fields: result.error.fields, values };
  revalidatePath("/");
  return { error: null, fields: [], values: emptyValues };
}

export async function updateGameAction(id: string, _prev: AddGameState, formData: FormData): Promise<AddGameState> {
  const values = readValues(formData);
  const result = await games.update(id, values);
  if (!result.ok) {
    if (result.error.rule === "game-not-found") revalidatePath("/"); // supprimé ailleurs : la liste affichée est périmée
    return { error: result.error.message, fields: result.error.fields, values };
  }
  revalidatePath("/");
  return { error: null, fields: [], values };
}

export async function deleteGameAction(id: string): Promise<DeleteState> {
  const result = await games.remove(id);
  revalidatePath("/"); // aussi si le jeu n'existe plus : la ligne périmée doit disparaître
  return { error: result.ok ? null : result.error.message };
}
