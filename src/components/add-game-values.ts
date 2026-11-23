// Valeurs du formulaire d'ajout. Module neutre (ni client ni serveur) : importable par l'action serveur comme par le formulaire.
export type AddGameValues = {
  name: string;
  status: string;
  minPlayers: string;
  maxPlayers: string;
  duration: string;
  minAge: string;
  publisher: string;
  notes: string;
};
export type AddGameState = { error: string | null; values: AddGameValues };

export const emptyValues: AddGameValues = { name: "", status: "envie", minPlayers: "", maxPlayers: "", duration: "", minAge: "", publisher: "", notes: "" };
