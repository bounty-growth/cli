#!/usr/bin/env node

import { createProgram } from "./program";
import { formatError } from "./lib/errors";

export async function run(argv = process.argv) {
  const program = createProgram();
  await program.parseAsync(argv);
}

run().catch((error) => {
  console.error(formatError(error));
  process.exitCode = 1;
});
