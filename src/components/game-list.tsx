import type { Game } from "@/services/games";

export function GameList({ games }: { games: Game[] }) {
  if (games.length === 0) return <p>Aucun jeu</p>;
  return (
    <ul>
      {games.map((g) => (
        <li key={g.id}>{g.name}</li>
      ))}
    </ul>
  );
}
