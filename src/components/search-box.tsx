"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SearchBoxView({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="search">Rechercher un jeu</Label>
      <Input id="search" name="q" type="text" role="searchbox" defaultValue={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// La recherche vit dans l'URL (?q=…) : elle survit à un ajout, une modification ou une suppression, et se partage.
export function SearchBox({ value }: { value: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <SearchBoxView
      value={value}
      onChange={(q) => {
        const params = new URLSearchParams(window.location.search);
        if (q.trim()) params.set("q", q);
        else params.delete("q");
        const qs = params.toString();
        startTransition(() => router.replace(qs ? `/?${qs}` : "/", { scroll: false }));
      }}
    />
  );
}
