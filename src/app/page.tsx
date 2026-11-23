import { Suspense } from "react";
import { addGameAction, deleteGameAction, updateGameAction } from "@/app/actions";
import { AddGameForm } from "@/components/add-game-form";
import { GameList } from "@/components/game-list";
import { SearchBox } from "@/components/search-box";
import { games } from "@/container";

type SearchParams = Promise<{ q?: string | string[] }>;

// Les paramètres d'URL sont lus dans Suspense (données dynamiques) ; le service interprète la recherche.
async function Games({ searchParams }: { searchParams: SearchParams }) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q : "";
  return (
    <>
      <SearchBox value={search} />
      <GameList games={await games.list({ q: search })} updateAction={updateGameAction} deleteAction={deleteGameAction} filtered={search.trim() !== ""} />
    </>
  );
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">Ma ludothèque</h1>
      <AddGameForm action={addGameAction} />
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <Games searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
