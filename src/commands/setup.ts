import type { Command } from "commander";

import { installSkills, type InstallSkillsOptions } from "./skills-install";

export type SetupSubcommand = "skills";

export type SetupOptions = InstallSkillsOptions;

export type SetupDependencies = {
  installSkills?: typeof installSkills;
};

export function registerSetupCommand(program: Command) {
  program
    .command("setup")
    .description("Set up Bounty integrations for AI coding agents")
    .argument("<subcommand>", 'What to set up: "skills"')
    .option("-g, --global", "Install skills globally instead of project-local")
    .option("-a, --agent <agent>", "Install skills to a specific agent")
    .option("--all", "Install skills to every detected AI coding agent")
    .action(async (subcommand: SetupSubcommand, options: SetupOptions) => {
      await handleSetupCommand(subcommand, options);
    });
}

export async function handleSetupCommand(
  subcommand: SetupSubcommand,
  options: SetupOptions = {},
  dependencies: SetupDependencies = {}
) {
  if (subcommand !== "skills") {
    throw new Error(
      'Unknown setup subcommand. Available subcommands: "skills".'
    );
  }

  const install = dependencies.installSkills ?? installSkills;
  await install({
    agent: options.agent,
    all: options.all,
    global: options.global,
    yes: options.yes,
  });
}
