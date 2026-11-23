import { Suspense } from "react";
import { addGameAction, deleteGameAction, updateGameAction } from "@/app/actions";
import { AddGameForm } from "@/components/add-game-form";
import { Filters } from "@/components/filters";
import { GameList } from "@/components/game-list";
import { games } from "@/container";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const text = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

// Les paramètres d'URL sont lus dans Suspense (données dynamiques) ; le service valide et applique les filtres.
async function Games({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = { q: text(params.q), status: text(params.status) || "tous", players: text(params.players), duration: text(params.duration) };
  const result = await games.query(raw);
  // Filtre refusé : on affiche le message du service et la liste sans filtre.
  const list = result.ok ? result.games : await games.list();
  const filtered = result.ok && (raw.q.trim() !== "" || raw.status !== "tous" || raw.players.trim() !== "" || raw.duration.trim() !== "");
  return (
    <>
      <Filters values={raw} error={result.ok ? null : result.error} />
      <GameList games={list} updateAction={updateGameAction} deleteAction={deleteGameAction} filtered={filtered} />
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
