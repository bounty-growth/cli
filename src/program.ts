import { Command } from "commander";

import { registerAuthCommands } from "./commands/auth";
import { registerConfigCommand } from "./commands/config";
import { registerDataCommands } from "./commands/data";
import { registerInitCommand } from "./commands/init";
import { registerSetupCommand } from "./commands/setup";
import { registerToolCommands } from "./commands/tools";

export function createProgram() {
  const program = new Command();

  program
    .name("bounty-cli")
    .description("Bounty marketing operations CLI")
    .version("0.1.5")
    .showHelpAfterError();

  registerAuthCommands(program);
  registerConfigCommand(program);
  registerDataCommands(program);
  registerInitCommand(program);
  registerSetupCommand(program);
  registerToolCommands(program);

  return program;
}
