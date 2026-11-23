"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { AddGameForm } from "@/components/add-game-form";
import type { AddGameState } from "@/components/add-game-values";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// L'ajout s'ouvre dans un panneau latéral : la liste reste l'écran principal. Le panneau se ferme après un ajout réussi.
export function AddGamePanel({ action }: { action: (prev: AddGameState, formData: FormData) => Promise<AddGameState> }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="lg" />}>
        <Plus />
        Ajouter un jeu
      </SheetTrigger>
      <SheetContent className="overflow-y-auto data-[side=right]:sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-xl font-semibold">Ajouter un jeu</SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-6">
          <AddGameForm action={action} onAdded={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
