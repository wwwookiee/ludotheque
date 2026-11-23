import { Suspense } from "react";
import { addGameAction, deleteGameAction, updateGameAction } from "@/app/actions";
import { AddGamePanel } from "@/components/add-game-panel";
import { Filters } from "@/components/filters";
import { GameList } from "@/components/game-list";
import { ThemeToggle } from "@/components/theme-toggle";
import { games } from "@/container";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const text = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

// Les paramètres d'URL sont lus dans Suspense (données dynamiques) ; le service valide et applique les filtres.
async function Games({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = { q: text(params.q), status: text(params.status), players: text(params.players), duration: text(params.duration) };
  // Filtre refusé : le service renvoie le message et la liste sans filtre.
  const { games: list, active, error } = await games.query(raw);
  return (
    <>
      <Filters values={raw} error={error} />
      <GameList games={list} updateAction={updateGameAction} deleteAction={deleteGameAction} filtered={active} />
    </>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-heading text-4xl font-bold">Ma ludothèque</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AddGamePanel action={addGameAction} />
        </div>
      </header>
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <Games searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
