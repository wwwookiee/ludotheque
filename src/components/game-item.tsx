"use client";

import { useActionState, useState } from "react";
import type { AddGameState } from "@/components/add-game-values";
import { formatDetails, toValues } from "@/components/game-details";
import { GameFields } from "@/components/game-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Game } from "@/services/games";

export type UpdateAction = (id: string, prev: AddGameState, formData: FormData) => Promise<AddGameState>;

type ViewProps = {
  game: Game;
  mode: "view" | "edit";
  editState?: AddGameState;
  editAction?: (formData: FormData) => void;
  pending?: boolean;
  onEdit: () => void;
  onCancel: () => void;
};

const itemClass = "rounded-lg border border-border bg-card p-3 text-card-foreground";

// Vue pure : affichage selon le mode (consultation ou modification en place).
export function GameItemView({ game, mode, editState, editAction, pending, onEdit, onCancel }: ViewProps) {
  if (mode === "edit" && editState && editAction) {
    const prefix = `edit-${game.id}-`;
    return (
      <li className={itemClass}>
        <form action={editAction} className="flex flex-col gap-4">
          <GameFields prefix={prefix} values={editState.values} fields={editState.fields} errorId={`${prefix}form-error`} />
          {editState.error && (
            <p id={`${prefix}form-error`} role="alert" className="text-sm text-destructive">
              {editState.error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              Enregistrer
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </li>
    );
  }
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
  return <GameItemView game={game} mode="edit" editState={state} editAction={action} pending={pending} onEdit={onDone} onCancel={onDone} />;
}

export function GameItem({ game, updateAction }: { game: Game; updateAction: UpdateAction }) {
  const [editing, setEditing] = useState(false);
  if (editing) return <GameItemEdit game={game} updateAction={updateAction} onDone={() => setEditing(false)} />;
  return <GameItemView game={game} mode="view" onEdit={() => setEditing(true)} onCancel={() => setEditing(false)} />;
}
