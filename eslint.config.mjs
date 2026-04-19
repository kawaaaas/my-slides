// ESLint設定（フラットコンフィグ）
import eslint from "@eslint/js";
import cdkPlugin from "eslint-cdk-plugin";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // CDKコード用のルール
    files: ["infra/lib/**/*.ts", "infra/bin/**/*.ts"],
    extends: [cdkPlugin.configs.recommended],
  },
  {
    // 全TypeScriptファイル共通設定
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // ビルド成果物・依存関係を除外
    ignores: [
      "node_modules/**",
      "dist/**",
      "cdk.out/**",
      "website/dist/**",
      "**/*.js",
      "**/*.mjs",
      "**/*.cjs",
    ],
  },
]);
