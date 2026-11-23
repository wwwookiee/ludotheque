"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { Field } from "@/components/field";
import { applyFilter, toSearch, type FilterValues } from "@/components/filters-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALL_STATUSES, type FilterError } from "@/services/games";

type FilterName = keyof FilterValues;
type FilterIssue = Pick<FilterError, "message" | "fields">;

const STATUS_LABELS = [[ALL_STATUSES, "Tous"], ["possede", "Possédé"], ["envie", "Envie"]] as const;

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
    <section aria-label="Recherche et filtres" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1">
          <Field id="search" label="Rechercher un jeu">
            <Input id="search" name="q" type="text" role="searchbox" defaultValue={values.q} onChange={(e) => onChange("q", e.target.value)} />
          </Field>
        </div>
        <div className="flex flex-col gap-1.5">
          <span id="filter-status-label" className="text-sm font-medium">
            Statut
          </span>
          {/* Un clic suffit : les trois statuts sont visibles, celui qui est actif est enfoncé. */}
          <div role="group" aria-labelledby="filter-status-label" className="flex gap-1 rounded-lg bg-muted p-1" {...flag("status")}>
            {STATUS_LABELS.map(([value, label]) => (
              <Button key={value} type="button" size="sm" variant={(values.status || ALL_STATUSES) === value ? "default" : "ghost"} aria-pressed={(values.status || ALL_STATUSES) === value} onClick={() => onChange("status", value)}>
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="w-28">
          <Field id="filter-players" label="Joueurs">
            <Input id="filter-players" name="players" inputMode="numeric" defaultValue={values.players} onChange={(e) => onChange("players", e.target.value)} {...flag("players")} />
          </Field>
        </div>
        <div className="w-36">
          <Field id="filter-duration" label="Durée max (min)">
            <Input id="filter-duration" name="duration" inputMode="numeric" defaultValue={values.duration} onChange={(e) => onChange("duration", e.target.value)} {...flag("duration")} />
          </Field>
        </div>
      </div>
      {error && (
        <p id="filters-error" role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}
    </section>
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
