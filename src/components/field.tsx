import { Label } from "@/components/ui/label";

// Un champ de formulaire : son libellé relié à son contrôle.
export function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
