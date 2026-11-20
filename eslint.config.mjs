import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Architecture 3 couches : seule src/data parle à la base.
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/data/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@libsql/*"] }],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: ["@libsql/*", "@/data/*", "@/data"] }],
    },
  },
  // Service : pur. Ni base, ni UI, ni framework.
  {
    files: ["src/services/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: ["@libsql/*", "@/data/*", "@/data", "@/components/*", "@/app/*", "react", "react-dom/*", "next", "next/*"] },
      ],
    },
  },
  // Service : pas d'horloge, d'aléatoire ni d'id généré (passés en paramètre).
  {
    files: ["src/services/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']", message: "Pas d'horloge dans le service : passe la date en paramètre." },
        { selector: "NewExpression[callee.name='Date']", message: "Pas d'horloge dans le service : passe la date en paramètre." },
        { selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']", message: "Pas d'aléatoire dans le service." },
        { selector: "CallExpression[callee.property.name='randomUUID']", message: "Pas de génération d'id dans le service : passe l'id en paramètre." },
      ],
    },
  },
  // Présentation : aucune couleur en dur, uniquement les jetons du thème (bg-card, text-muted-foreground…).
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**", "**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}\\b|rgb\\(|oklch\\(|-\\[#|\\b(bg|text|border)-(red|blue|green|yellow|zinc|gray|slate|white|black)\\b/]",
          message: "Couleur en dur : utilise un jeton du thème (bg-card, text-muted-foreground…).",
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b|\\b(bg|text|border)-(red|blue|green|yellow|zinc|gray|slate|white|black)\\b/]",
          message: "Couleur en dur : utilise un jeton du thème (bg-card, text-muted-foreground…).",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
