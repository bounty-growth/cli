import type { Command } from "commander";

import { signInWithBrowser } from "../lib/auth";
import { getEffectiveConfig } from "../lib/config";
import { writeLine } from "../lib/output";
import { installSkills, type InstallSkillsOptions } from "./skills-install";

export type InitOptions = InstallSkillsOptions & {
  browser?: boolean;
  skipAuth?: boolean;
  skipSkills?: boolean;
};

export type InitDependencies = {
  installSkills?: typeof installSkills;
  getEffectiveConfig?: typeof getEffectiveConfig;
  signInWithBrowser?: typeof signInWithBrowser;
  writeLine?: typeof writeLine;
};

export function registerInitCommand(program: Command) {
  program
    .command("init")
    .description("Set up Bounty CLI, install agent skills, and authenticate")
    .option(
      "--all",
      "Install skills to every detected AI coding agent unless --agent is used"
    )
    .option("-y, --yes", "Run setup non-interactively")
    .option("-g, --global", "Install skills globally", true)
    .option("-a, --agent <agent>", "Install skills to a specific agent")
    .option(
      "-b, --browser",
      "Authenticate via browser without prompting (recommended for agents)"
    )
    .option("--skip-auth", "Skip browser authentication")
    .option("--skip-skills", "Skip agent skill installation")
    .action(async (options: InitOptions) => {
      await handleInitCommand(options);
    });
}

export async function handleInitCommand(
  options: InitOptions = {},
  dependencies: InitDependencies = {}
) {
  const install = dependencies.installSkills ?? installSkills;
  const resolveConfig = dependencies.getEffectiveConfig ?? getEffectiveConfig;
  const browserLogin = dependencies.signInWithBrowser ?? signInWithBrowser;
  const output = dependencies.writeLine ?? writeLine;

  if (!options.skipSkills) {
    output("Installing Bounty marketing skills for AI coding agents...");
    await install({
      agent: options.agent,
      all: options.all ?? true,
      global: options.global,
      yes: options.yes ?? true,
    });
    output("Bounty marketing skills installed.");
  }

  if (!options.skipAuth) {
    const config = await resolveConfig();
    output("Opening Bounty in your browser to finish login.");
    await browserLogin({
      config,
      onAuthorizeUrl: (url) => {
        output(`If it does not open, visit: ${url}`);
      },
    });
    output("Logged in to Bounty.");
  }

  output(
    "Setup complete. Restart your AI agent so it can discover the skills."
  );
}
