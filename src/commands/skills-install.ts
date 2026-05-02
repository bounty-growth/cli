import { installSkillsNative } from "./skills-native";

export type SkillsInstallOptions = {
  agent?: string;
  all?: boolean;
  yes?: boolean;
  global?: boolean;
};

export type InstallSkillsOptions = SkillsInstallOptions;

export type InstallSkillsDependencies = {
  installSkillsNative?: typeof installSkillsNative;
};

export async function installSkills(
  options: InstallSkillsOptions = {},
  dependencies: InstallSkillsDependencies = {}
) {
  const nativeInstaller =
    dependencies.installSkillsNative ?? installSkillsNative;

  await nativeInstaller({
    agent: options.agent,
    all: options.all,
    global: options.global,
  });
}
