import { GameItem, type DeleteAction, type UpdateAction } from "@/components/game-item";
import type { Game } from "@/services/games";

export function GameList({ games, updateAction, deleteAction, filtered = false }: { games: Game[]; updateAction: UpdateAction; deleteAction: DeleteAction; filtered?: boolean }) {
  if (games.length === 0) return <p className="text-muted-foreground">{filtered ? "Aucun jeu ne correspond à la recherche ou aux filtres." : "Aucun jeu"}</p>;
  const count = `${games.length} ${games.length > 1 ? "jeux" : "jeu"}`;
  return (
    <section className="flex flex-col gap-3" aria-label="Jeux">
      <p className="font-semibold">{filtered ? `${count} ${games.length > 1 ? "correspondent" : "correspond"}` : count}</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((g) => (
          <GameItem key={g.id} game={g} updateAction={updateAction} deleteAction={deleteAction} />
        ))}
      </ul>
    </section>
  );
}
