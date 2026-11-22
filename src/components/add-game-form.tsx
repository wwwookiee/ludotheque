"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type AddGameState = { error: string | null; name: string };

export function AddGameFormView({
  state,
  action,
  pending,
}: {
  state: AddGameState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  return (
    <form action={action} className="flex flex-col gap-2">
      <Label htmlFor="name">Nom du jeu</Label>
      <div className="flex gap-2">
        <Input id="name" name="name" defaultValue={state.name} aria-invalid={state.error ? true : undefined} />
        <Button type="submit" disabled={pending}>Ajouter</Button>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function AddGameForm({
  action,
}: {
  action: (prev: AddGameState, formData: FormData) => Promise<AddGameState>;
}) {
  const [state, formAction, pending] = useActionState(action, { error: null, name: "" });
  return <AddGameFormView state={state} action={formAction} pending={pending} />;
}
