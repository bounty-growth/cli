import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "tsup";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));

function blockRuntimeAppImports() {
  return {
    name: "block-runtime-app-imports",
    setup(build: {
      onResolve: (
        options: { filter: RegExp },
        callback: (args: { path: string }) => {
          errors: Array<{ text: string }>;
        }
      ) => void;
    }) {
      build.onResolve({ filter: /^@\// }, (args) => ({
        errors: [
          {
            text: `The Bounty CLI cannot runtime import app alias "${args.path}". Move shared types into src/lib/api-contracts.ts or keep the import type-only.`,
          },
        ],
      }));
      build.onResolve(
        { filter: /^(next|react|react-dom)(\/.*)?$/ },
        (args) => ({
          errors: [
            {
              text: `The Bounty CLI cannot runtime import Next.js app dependency "${args.path}".`,
            },
          ],
        })
      );
    },
  };
}

export default defineConfig({
  entry: [path.join(packageRoot, "src/index.ts")],
  format: ["cjs"],
  platform: "node",
  target: "node20",
  outDir: path.join(packageRoot, "dist"),
  clean: true,
  splitting: false,
  outExtension: () => ({ js: ".cjs" }),
  esbuildPlugins: [blockRuntimeAppImports()],
  noExternal: [
    "@inquirer/prompts",
    "@supabase/supabase-js",
    "commander",
    "zod",
  ],
});
