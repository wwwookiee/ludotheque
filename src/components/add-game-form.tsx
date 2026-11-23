"use client";

import { useActionState } from "react";
import { emptyValues, type AddGameState } from "@/components/add-game-values";
import { GameFields } from "@/components/game-fields";
import { Button } from "@/components/ui/button";

export function AddGameFormView({
  state,
  action,
  pending,
}: {
  state: AddGameState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  const { values, error, fields } = state;
  return (
    <form action={action} className="flex flex-col gap-4">
      <GameFields prefix="" values={values} fields={fields} errorId="form-error" />
      {error && (
        <p id="form-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="self-start">
        Ajouter
      </Button>
    </form>
  );
}

export function AddGameForm({
  action,
  onAdded,
}: {
  action: (prev: AddGameState, formData: FormData) => Promise<AddGameState>;
  onAdded?: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (prev: AddGameState, formData: FormData) => {
      const next = await action(prev, formData);
      if (!next.error) onAdded?.(); // ajouté : le panneau peut se fermer
      return next;
    },
    { error: null, fields: [], values: emptyValues },
  );
  return <AddGameFormView state={state} action={formAction} pending={pending} />;
}
