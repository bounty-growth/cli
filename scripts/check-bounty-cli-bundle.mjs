#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const bundlePath = path.join(repoRoot, "dist/index.cjs");

const forbiddenFragments = [
  "@/app",
  "@/backend",
  "@/components",
  "@/db_types",
  "@/lib/supabase/server",
  ".next/",
  "NextRequest",
  "NextResponse",
  "createSupabaseServerClient",
  "getRequestContext",
  "next/",
  "next/dist",
  "next/server",
  "react-dom",
  "react/jsx-runtime",
  "src/app/",
  "src/app/api",
];

const bundle = await readFile(bundlePath, "utf8");
const matches = forbiddenFragments.filter((fragment) =>
  bundle.includes(fragment)
);

if (matches.length > 0) {
  console.error("Bounty CLI bundle includes forbidden app/runtime fragments:");
  for (const match of matches) {
    console.error(`- ${match}`);
  }
  process.exit(1);
}

console.log("Bounty CLI bundle boundary check passed");
