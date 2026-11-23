import type { AddGameValues } from "@/components/add-game-values";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AddGameField } from "@/services/games";

const STATUS_LABELS = { possede: "Possédé", envie: "Envie" };

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

// Champs communs à l'ajout et à la modification. prefix : rend les ids uniques quand plusieurs formulaires sont sur la page.
export function GameFields({ prefix, values, fields, errorId }: { prefix: string; values: AddGameValues; fields: AddGameField[]; errorId: string }) {
  // Seuls les champs fautifs sont signalés invalides, et reliés au message d'erreur.
  const flag = (id: AddGameField) => (fields.includes(id) ? ({ "aria-invalid": true, "aria-describedby": errorId } as const) : {});
  const text = (id: keyof AddGameValues, label: string, numeric = false) => (
    <Field id={prefix + id} label={label}>
      <Input id={prefix + id} name={id} defaultValue={values[id]} inputMode={numeric ? "numeric" : undefined} {...flag(id as AddGameField)} />
    </Field>
  );
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        {text("name", "Nom du jeu")}
        <Field id={`${prefix}status`} label="Statut">
          <Select name="status" defaultValue={values.status} items={STATUS_LABELS}>
            <SelectTrigger id={`${prefix}status`} className="w-full sm:w-40" {...flag("status")}>
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
    </>
  );
}
