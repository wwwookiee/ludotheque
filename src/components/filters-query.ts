// Construction de l'URL des filtres. Module neutre : testable sans navigateur, utilisé par le composant client.
export type FilterValues = { q: string; status: string; players: string; duration: string };

export function applyFilter(values: FilterValues, name: keyof FilterValues, value: string): FilterValues {
  return { ...values, [name]: value };
}

// Valeurs → query string. « tous » et les valeurs vides ne sont pas écrits : l'URL de départ reste « / ».
export function toSearch(values: FilterValues): string {
  const params = new URLSearchParams();
  for (const [name, value] of Object.entries(values)) {
    if (value.trim() && !(name === "status" && value === "tous")) params.set(name, value);
  }
  return params.toString();
}
