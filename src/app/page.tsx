import { GameList } from "@/components/game-list";
import { games } from "@/container";

export default async function Home() {
  return (
    <main className="p-8">
      <GameList games={await games.list()} />
    </main>
  );
}
