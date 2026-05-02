import { execFileSync } from "node:child_process";

import { installSkillsNative } from "./skills-native";

export const SKILL_REPOS = ["bounty-growth/cli"] as const;

export type SkillsInstallOptions = {
  agent?: string;
  all?: boolean;
  yes?: boolean;
  global?: boolean;
  includeNpxYes?: boolean;
  repo?: string;
};

export type InstallSkillsOptions = Omit<SkillsInstallOptions, "repo">;

export type InstallSkillsDependencies = {
  runCommand?: (command: string, args: string[]) => void;
  hasNpx?: () => boolean;
  installSkillsNative?: typeof installSkillsNative;
};

export async function installSkills(
  options: InstallSkillsOptions = {},
  dependencies: InstallSkillsDependencies = {}
) {
  const hasNpx = dependencies.hasNpx ?? defaultHasNpx;
  const runCommand = dependencies.runCommand ?? defaultRunCommand;
  const nativeInstaller =
    dependencies.installSkillsNative ?? installSkillsNative;

  for (const repo of SKILL_REPOS) {
    if (hasNpx()) {
      const [command, ...args] = buildSkillsInstallArgs({
        repo,
        agent: options.agent,
        all: options.all,
        yes: options.yes ?? true,
        global: options.global ?? true,
        includeNpxYes: true,
      });

      runCommand(command, args);
      continue;
    }

    await nativeInstaller(repo, {
      agent: options.agent,
      all: options.all,
    });
  }
}

export function buildSkillsInstallArgs(
  options: SkillsInstallOptions = {}
): string[] {
  const args = ["npx"];

  if (options.includeNpxYes) {
    args.push("-y");
  }

  args.push("skills", "add", options.repo ?? SKILL_REPOS[0], "--full-depth");

  if (options.global ?? true) {
    args.push("--global");
  }

  if (options.agent) {
    args.push("--agent", options.agent);
  } else if (options.all ?? true) {
    args.push("--all");
  }

  if (options.yes) {
    args.push("--yes");
  }

  return args;
}

export function cleanNpmEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.startsWith("npm_") || key === "INIT_CWD" || key === "PROJECT_CWD") {
      delete env[key];
    }
  }
  return env;
}

function defaultHasNpx() {
  try {
    execFileSync("npx", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function defaultRunCommand(command: string, args: string[]) {
  execFileSync(command, args, {
    stdio: "inherit",
    env: cleanNpmEnv(),
  });
}
