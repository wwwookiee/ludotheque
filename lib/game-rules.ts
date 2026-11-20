// Règles métier pures (voir INTENT.md) : aucun accès au stockage ici.
import type { Game, GameInput } from "./games-store";

export type Filters = {
  search?: string;
  status?: Game["status"]; // absent = tous
  players?: number;
  duration?: number;
};

const STATUSES: Game["status"][] = ["possede", "envie"];

export const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

// Clé de comparaison : nom nettoyé, sans majuscules ni accents.
export const nameKey = (name: string) =>
  normalizeName(name).normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

const isPositiveInt = (n: unknown) => Number.isInteger(n) && (n as number) > 0;

// Renvoie la liste des règles enfreintes (vide si la saisie est valide).
export function validateGame(game: GameInput, others: Game[], id?: number): string[] {
  const errors: string[] = [];
  const name = normalizeName(game.name);

  if (!name) errors.push("Le nom est obligatoire.");
  else if (others.some((g) => g.id !== id && nameKey(g.name) === nameKey(name)))
    errors.push("Un jeu porte déjà ce nom.");

  if (!STATUSES.includes(game.status)) errors.push("Le statut doit être « possédé » ou « envie ».");

  const { playersMin: min, playersMax: max } = game;
  if ((min === null) !== (max === null))
    errors.push("Le nombre de joueurs min et max se renseignent ensemble.");
  else if (min !== null && max !== null) {
    if (!isPositiveInt(min) || !isPositiveInt(max))
      errors.push("Le nombre de joueurs doit être un entier supérieur à 0.");
    else if (min > max) errors.push("Le nombre de joueurs min doit être inférieur ou égal au max.");
  }

  if (game.duration !== null && !isPositiveInt(game.duration))
    errors.push("La durée doit être un entier de minutes supérieur à 0.");
  if (game.minAge !== null && !isPositiveInt(game.minAge))
    errors.push("L'âge minimum doit être un entier supérieur à 0.");

  return errors;
}

// Recherche + filtres cumulés, puis tri par nom (sans majuscules ni accents).
export function filterGames(games: Game[], f: Filters): Game[] {
  const search = nameKey(f.search ?? "");
  return games
    .filter((g) => !search || nameKey(g.name).includes(search))
    .filter((g) => !f.status || g.status === f.status)
    .filter(
      (g) =>
        f.players === undefined ||
        (g.playersMin !== null && g.playersMax !== null && g.playersMin <= f.players && f.players <= g.playersMax),
    )
    .filter((g) => f.duration === undefined || (g.duration !== null && g.duration <= f.duration))
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));
}
