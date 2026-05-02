import { installSkillsNative } from "./skills-native";

export const SKILL_REPOS = ["bounty-growth/cli"] as const;

export type SkillsInstallOptions = {
  agent?: string;
  all?: boolean;
  yes?: boolean;
  global?: boolean;
  repo?: string;
};

export type InstallSkillsOptions = Omit<SkillsInstallOptions, "repo">;

export type InstallSkillsDependencies = {
  installSkillsNative?: typeof installSkillsNative;
};

export async function installSkills(
  options: InstallSkillsOptions = {},
  dependencies: InstallSkillsDependencies = {}
) {
  const nativeInstaller =
    dependencies.installSkillsNative ?? installSkillsNative;

  for (const repo of SKILL_REPOS) {
    await nativeInstaller(repo, {
      agent: options.agent,
      all: options.all,
      global: options.global,
    });
  }
}
