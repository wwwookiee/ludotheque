import { Badge } from "@/components/ui/badge";
import type { Game } from "@/services/games";

export function GameList({ games }: { games: Game[] }) {
  if (games.length === 0) return <p className="text-muted-foreground">Aucun jeu</p>;
  return (
    <ul className="flex flex-col gap-2">
      {games.map((g) => (
        <li key={g.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-card-foreground">
          <span>{g.name}</span>
          <Badge variant={g.status === "possede" ? "default" : "secondary"}>
            {g.status === "possede" ? "Possédé" : "Envie"}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
