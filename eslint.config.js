import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "dist/**",
      
      // Páginas ainda não adequadas às regras do lint
      "src/app/(protected)/projects/[id]/metricas-redes-sociais/page.tsx",
      "src/app/(protected)/projects/[id]/casas-parceiras/new/page.tsx",
      "src/app/(protected)/projects/[id]/casas-parceiras/[slug]/edit/page.tsx",
      
      "*.config.js",
      "*.config.ts",
      
      "*.log",
      ".env*",
    ],
  },
  {
    rules: {
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig; 