import { Badge } from "@/components/ui/badge";
import type { Game } from "@/services/games";

// Affichage seulement : « 2–4 joueurs · 45 min · 8 ans et + · Kosmos ». Un détail absent disparaît avec son séparateur.
function details(g: Game): string {
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

export function GameList({ games }: { games: Game[] }) {
  if (games.length === 0) return <p className="text-muted-foreground">Aucun jeu</p>;
  return (
    <ul className="flex flex-col gap-2">
      {games.map((g) => {
        const line = details(g);
        return (
          <li key={g.id} className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3 text-card-foreground">
            <div className="flex items-center justify-between">
              <span>{g.name}</span>
              <Badge variant={g.status === "possede" ? "default" : "secondary"}>
                {g.status === "possede" ? "Possédé" : "Envie"}
              </Badge>
            </div>
            {line && (
              <p data-slot="game-details" className="text-sm text-muted-foreground">
                {line}
              </p>
            )}
            {g.notes && <p className="text-sm">{g.notes}</p>}
          </li>
        );
      })}
    </ul>
  );
}
