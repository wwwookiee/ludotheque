import type { Game } from "@/services/games";

// Affichage seulement : « 2–4 joueurs · 45 min · 8 ans et + · Kosmos ». Un détail absent disparaît avec son séparateur.
export function formatDetails(g: Game): string {
  const parts: string[] = [];
  if (g.minPlayers !== undefined && g.maxPlayers !== undefined) {
    const n = g.minPlayers === g.maxPlayers ? `${g.minPlayers}` : `${g.minPlayers}–${g.maxPlayers}`;
    parts.push(`${n} ${g.maxPlayers > 1 ? "joueurs" : "joueur"}`);
  }
  if (g.duration !== undefined) parts.push(`${g.duration} min`);
  if (g.minAge !== undefined) parts.push(`${g.minAge} ans et +`);
  if (g.publisher) parts.push(g.publisher);
  return parts.join(" · ");
}

// Valeurs d'un jeu sous forme de texte, pour préremplir le formulaire de modification.
export function toValues(g: Game) {
  return {
    name: g.name,
    status: g.status as string,
    minPlayers: String(g.minPlayers ?? ""),
    maxPlayers: String(g.maxPlayers ?? ""),
    duration: String(g.duration ?? ""),
    minAge: String(g.minAge ?? ""),
    publisher: g.publisher ?? "",
    notes: g.notes ?? "",
  };
}
