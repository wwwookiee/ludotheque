import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Classes écrites en entier : Tailwind ne détecte pas les noms construits.
const colors = [
  ["background", "bg-background", "text-foreground"],
  ["foreground", "bg-foreground", "text-background"],
  ["card", "bg-card", "text-card-foreground"],
  ["primary", "bg-primary", "text-primary-foreground"],
  ["secondary", "bg-secondary", "text-secondary-foreground"],
  ["muted", "bg-muted", "text-muted-foreground"],
  ["accent", "bg-accent", "text-accent-foreground"],
  ["destructive", "bg-destructive", "text-white"],
  ["border", "bg-border", "text-foreground"],
  ["input", "bg-input", "text-foreground"],
  ["ring", "bg-ring", "text-background"],
] as const;

const buttons = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystem() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 p-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Design system</h1>
          <p className="text-muted-foreground">
            Option C · clair et sombre. Par défaut le réglage du système, le bouton mémorise ton choix (next-themes).
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Couleurs">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {colors.map(([name, bg, fg]) => (
            <div key={name} className={`${bg} ${fg} flex h-20 items-end rounded-lg border border-border p-2 text-xs font-medium`}>
              {name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typographie">
        <div className="flex flex-col gap-1">
          <p className="text-4xl font-bold">Mes jeux</p>
          <p className="text-xl font-bold">Les Aventuriers du Rail</p>
          <p>2 à 5 joueurs, 45 minutes, dès 8 ans.</p>
          <p className="text-sm text-muted-foreground">Éditeur · Days of Wonder</p>
          <p className="font-mono text-sm">Geist Mono · 12345</p>
        </div>
      </Section>

      <Section title="Boutons">
        <div className="flex flex-wrap items-center gap-2">
          {buttons.map((v) => (
            <Button key={v} variant={v}>{v}</Button>
          ))}
          <Button disabled>disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="xs">xs</Button>
          <Button size="sm">sm</Button>
          <Button>default</Button>
          <Button size="lg">lg</Button>
        </div>
      </Section>

      <Section title="Champs">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" defaultValue="Catan" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Statut</Label>
            <Select defaultValue="envie">
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="possede">Possédé</SelectItem>
                <SelectItem value="envie">Envie</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="max">Joueurs max</Label>
            <Input id="max" defaultValue="2" aria-invalid />
            <p className="text-xs text-destructive">Le max doit être ≥ au min.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="off">Désactivé</Label>
            <Input id="off" disabled defaultValue="—" />
          </div>
        </div>
      </Section>

      <Section title="Carte de jeu">
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Les Aventuriers du Rail</CardTitle>
            <CardDescription>Days of Wonder</CardDescription>
            <Badge className="w-fit">Possédé</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p className="flex gap-4">
              <span><b className="text-foreground">2–5</b> joueurs</span>
              <span><b className="text-foreground">45</b> min</span>
              <span><b className="text-foreground">8+</b> ans</span>
            </p>
            <p>Toujours une victoire facile en famille.</p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm" variant="secondary">Modifier</Button>
            <Button size="sm" variant="ghost">Supprimer</Button>
          </CardFooter>
        </Card>
      </Section>
    </main>
  );
}
