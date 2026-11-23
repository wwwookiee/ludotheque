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
}: {
  action: (prev: AddGameState, formData: FormData) => Promise<AddGameState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, fields: [], values: emptyValues });
  return <AddGameFormView state={state} action={formAction} pending={pending} />;
}
