"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { applyFilter, toSearch, type FilterValues } from "@/components/filters-query";
import { ALL_STATUSES, type FilterError } from "@/services/games";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterName = keyof FilterValues;
type FilterIssue = Pick<FilterError, "message" | "fields">;

const STATUS_LABELS = { [ALL_STATUSES]: "Tous", possede: "Possédé", envie: "Envie" };

export function FiltersView({
  values,
  error,
  onChange,
}: {
  values: FilterValues;
  error: FilterIssue | null;
  onChange: (name: FilterName, value: string) => void;
}) {
  // Seul le champ refusé par le service est signalé invalide, et relié au message.
  const flag = (name: FilterError["fields"][number]) =>
    error?.fields.includes(name) ? ({ "aria-invalid": true, "aria-describedby": "filters-error" } as const) : {};
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="search">Rechercher un jeu</Label>
        <Input id="search" name="q" type="text" role="searchbox" defaultValue={values.q} onChange={(e) => onChange("q", e.target.value)} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-status">Statut</Label>
          <Select value={values.status || ALL_STATUSES} onValueChange={(v) => onChange("status", String(v))} items={STATUS_LABELS}>
            <SelectTrigger id="filter-status" className="w-full" {...flag("status")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_STATUSES}>Tous</SelectItem>
              <SelectItem value="possede">Possédé</SelectItem>
              <SelectItem value="envie">Envie</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-players">Joueurs</Label>
          <Input id="filter-players" name="players" inputMode="numeric" defaultValue={values.players} onChange={(e) => onChange("players", e.target.value)} {...flag("players")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-duration">Durée max (min)</Label>
          <Input id="filter-duration" name="duration" inputMode="numeric" defaultValue={values.duration} onChange={(e) => onChange("duration", e.target.value)} {...flag("duration")} />
        </div>
      </div>
      {error && (
        <p id="filters-error" role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}

// Recherche et filtres vivent dans l'URL (?q=…&status=…&players=…&duration=…) : ils survivent à un ajout,
// une modification ou une suppression, et se partagent. Le service les valide et les applique.
export function Filters({ values, error }: { values: FilterValues; error: FilterIssue | null }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  // Valeurs courantes côté client : l'URL du navigateur n'est à jour qu'à la fin de la navigation, donc deux
  // changements rapides s'y perdraient. Initialisées depuis le serveur ; les champs texte sont non contrôlés,
  // ils reflètent donc déjà ce que l'utilisateur a saisi.
  const current = useRef(values);
  return (
    <FiltersView
      values={values}
      error={error}
      onChange={(name, value) => {
        current.current = applyFilter(current.current, name, value);
        const qs = toSearch(current.current);
        startTransition(() => router.replace(qs ? `/?${qs}` : "/", { scroll: false }));
      }}
    />
  );
}
