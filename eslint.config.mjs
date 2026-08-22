import { defineConfig, globalIgnores } from "eslint/config";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default defineConfig([
  { files: ["**/*.{ts,tsx}"], languageOptions: { parser: tsParser, parserOptions: { project: "./tsconfig.json" } }, plugins: { "@typescript-eslint": tsPlugin }, rules: { "@typescript-eslint/no-unused-vars": "error", "@typescript-eslint/no-explicit-any": "error" } },
  globalIgnores([".next/**", "node_modules/**"]),
]);
