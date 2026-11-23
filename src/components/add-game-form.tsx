"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { emptyValues, type AddGameState, type AddGameValues } from "@/components/add-game-values";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_LABELS = { possede: "Possédé", envie: "Envie" };

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export function AddGameFormView({
  state,
  action,
  pending,
}: {
  state: AddGameState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  const { values, error } = state;
  const invalid = error ? true : undefined;
  const text = (id: keyof AddGameValues, label: string, numeric = false) => (
    <Field id={id} label={label}>
      <Input id={id} name={id} defaultValue={values[id]} inputMode={numeric ? "numeric" : undefined} aria-invalid={invalid} />
    </Field>
  );
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <Field id="name" label="Nom du jeu">
          <Input id="name" name="name" defaultValue={values.name} aria-invalid={invalid} />
        </Field>
        <Field id="status" label="Statut">
          <Select name="status" defaultValue={values.status} items={STATUS_LABELS}>
            <SelectTrigger id="status" className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="possede">Possédé</SelectItem>
              <SelectItem value="envie">Envie</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {text("minPlayers", "Joueurs min", true)}
        {text("maxPlayers", "Joueurs max", true)}
        {text("duration", "Durée (min)", true)}
        {text("minAge", "Âge min (ans)", true)}
      </div>
      {text("publisher", "Éditeur")}
      {text("notes", "Notes")}
      {error && (
        <p role="alert" className="text-sm text-destructive">
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
  const [state, formAction, pending] = useActionState(action, { error: null, values: emptyValues });
  return <AddGameFormView state={state} action={formAction} pending={pending} />;
}
