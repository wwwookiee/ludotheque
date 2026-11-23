import { GameItem, type UpdateAction } from "@/components/game-item";
import type { Game } from "@/services/games";

export function GameList({ games, updateAction }: { games: Game[]; updateAction: UpdateAction }) {
  if (games.length === 0) return <p className="text-muted-foreground">Aucun jeu</p>;
  return (
    <ul className="flex flex-col gap-2">
      {games.map((g) => (
        <GameItem key={g.id} game={g} updateAction={updateAction} />
      ))}
    </ul>
  );
}
