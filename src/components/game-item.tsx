"use client";

import { useActionState, useState } from "react";
import type { AddGameState, DeleteState } from "@/components/add-game-values";
import { formatDetails, toValues } from "@/components/game-details";
import { GameFields } from "@/components/game-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Game } from "@/services/games";

export type UpdateAction = (id: string, prev: AddGameState, formData: FormData) => Promise<AddGameState>;

export type DeleteAction = (id: string) => Promise<DeleteState>;

const itemClass = "rounded-lg border border-border bg-card p-3 text-card-foreground";

function CancelButton({ onCancel }: { onCancel: () => void }) {
  return (
    <Button type="button" variant="outline" onClick={onCancel}>
      Annuler
    </Button>
  );
}

// Consultation : le jeu, ses détails et les gestes possibles.
export function GameRow({ game, onEdit, onAskDelete }: { game: Game; onEdit: () => void; onAskDelete: () => void }) {
  const line = formatDetails(game);
  return (
    <li className={`${itemClass} flex flex-col gap-1`}>
      <div className="flex items-center justify-between gap-2">
        <span>{game.name}</span>
        <div className="flex items-center gap-2">
          <Badge variant={game.status === "possede" ? "default" : "secondary"}>{game.status === "possede" ? "Possédé" : "Envie"}</Badge>
          <Button type="button" variant="ghost" size="sm" aria-label={`Modifier ${game.name}`} onClick={onEdit}>
            Modifier
          </Button>
          <Button type="button" variant="ghost" size="sm" aria-label={`Supprimer ${game.name}`} onClick={onAskDelete}>
            Supprimer
          </Button>
        </div>
      </div>
      {line && (
        <p data-slot="game-details" className="text-sm text-muted-foreground">
          {line}
        </p>
      )}
      {game.notes && <p className="text-sm">{game.notes}</p>}
    </li>
  );
}

// Modification en place : même formulaire que l'ajout, prérempli ; les ids sont propres au jeu.
export function GameEditForm({ game, state, action, pending, onCancel }: { game: Game; state: AddGameState; action: (formData: FormData) => void; pending: boolean; onCancel: () => void }) {
  const prefix = `edit-${game.id}-`;
  return (
    <li className={itemClass}>
      <form action={action} className="flex flex-col gap-4">
        <GameFields prefix={prefix} values={state.values} fields={state.fields} errorId={`${prefix}form-error`} />
        {state.error && (
          <p id={`${prefix}form-error`} role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            Enregistrer
          </Button>
          <CancelButton onCancel={onCancel} />
        </div>
      </form>
    </li>
  );
}

// Confirmation : le jeu reste affiché et rien n'est supprimé tant que la suppression n'est pas confirmée.
export function GameDeleteConfirm({ game, state, action, pending, onCancel }: { game: Game; state: DeleteState; action: (formData: FormData) => void; pending: boolean; onCancel: () => void }) {
  return (
    <li className={`${itemClass} flex flex-col gap-2`}>
      <span>{game.name}</span>
      <form action={action} className="flex flex-col gap-2">
        <p>{`Supprimer « ${game.name} » ? Cette action est définitive.`}</p>
        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" variant="destructive" disabled={pending}>
            Confirmer la suppression
          </Button>
          <CancelButton onCancel={onCancel} />
        </div>
      </form>
    </li>
  );
}

// Formulaire de modification : monté seulement pendant l'édition, donc son état repart du jeu à chaque ouverture.
function GameItemEdit({ game, updateAction, onDone }: { game: Game; updateAction: UpdateAction; onDone: () => void }) {
  const [state, action, pending] = useActionState(
    async (prev: AddGameState, formData: FormData) => {
      const next = await updateAction(game.id, prev, formData);
      if (!next.error) onDone(); // enregistré : retour à la consultation
      return next;
    },
    { error: null, fields: [], values: toValues(game) } satisfies AddGameState,
  );
  return <GameEditForm game={game} state={state} action={action} pending={pending} onCancel={onDone} />;
}

function GameItemConfirm({ game, deleteAction, onCancel }: { game: Game; deleteAction: DeleteAction; onCancel: () => void }) {
  const [state, action, pending] = useActionState(() => deleteAction(game.id), { error: null });
  return <GameDeleteConfirm game={game} state={state} action={action} pending={pending} onCancel={onCancel} />;
}

export function GameItem({ game, updateAction, deleteAction }: { game: Game; updateAction: UpdateAction; deleteAction: DeleteAction }) {
  const [mode, setMode] = useState<"view" | "edit" | "confirm">("view");
  const back = () => setMode("view");
  if (mode === "edit") return <GameItemEdit game={game} updateAction={updateAction} onDone={back} />;
  if (mode === "confirm") return <GameItemConfirm game={game} deleteAction={deleteAction} onCancel={back} />;
  return <GameRow game={game} onEdit={() => setMode("edit")} onAskDelete={() => setMode("confirm")} />;
}
