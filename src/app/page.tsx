import { Suspense } from "react";
import { addGameAction } from "@/app/actions";
import { AddGameForm } from "@/components/add-game-form";
import { GameList } from "@/components/game-list";
import { games } from "@/container";

async function Games() {
  return <GameList games={await games.list()} />;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">Ma ludothèque</h1>
      <AddGameForm action={addGameAction} />
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <Games />
      </Suspense>
    </main>
  );
}
