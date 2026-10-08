import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/smash-bros-bingo/" : "/",
  plugins: lazyPlugins(() => [react(), tailwindcss()]),
  fmt: {},
  lint: {
    plugins: ["oxc", "typescript", "unicorn", "react"],
    categories: { correctness: "error" },
    env: { browser: true, builtin: true },
    rules: {
      "no-console": "error",
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": "error",
      "react/only-export-components": ["error", { allowConstantExport: true }],
    },
    overrides: [
      // ブラウザ確認スクリプトは結果を console に出す
      { files: ["scripts/**"], rules: { "no-console": "off" } },
    ],
    options: { typeAware: true, typeCheck: true },
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
  },
}));
