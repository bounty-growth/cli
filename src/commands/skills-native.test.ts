import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { installSkillsNative } from "./skills-native";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../..");

const originalArgv1 = process.argv[1];
const originalCwd = process.cwd();

let tempDir: string | undefined;

afterEach(() => {
  process.argv[1] = originalArgv1;
  process.chdir(originalCwd);

  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("native skills install", () => {
  it("installs bundled package skills for the selected agent", async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), "bounty-skills-test-"));
    process.chdir(tempDir);
    process.argv[1] = path.join(repoRoot, "src/index.ts");

    await installSkillsNative({
      agent: "codex",
    });

    expect(
      existsSync(path.join(tempDir, ".codex/skills/bounty-cli/SKILL.md"))
    ).toBe(true);
    expect(
      existsSync(path.join(tempDir, ".codex/skills/bounty-campaigns/SKILL.md"))
    ).toBe(true);
  });

  it("does not fall back to project-controlled cwd skills", async () => {
    tempDir = mkdtempSync(path.join(tmpdir(), "bounty-skills-test-"));
    const projectDir = path.join(tempDir, "project");
    const projectSkillDir = path.join(projectDir, "skills/project-skill");
    mkdirSync(projectSkillDir, { recursive: true });
    writeFileSync(
      path.join(projectSkillDir, "SKILL.md"),
      "---\nname: project-skill\ndescription: Project-controlled skill.\n---\n"
    );

    process.chdir(projectDir);
    process.argv[1] = path.join(tempDir, "package/dist/index.cjs");

    await expect(
      installSkillsNative({
        agent: "codex",
      })
    ).rejects.toThrow("No bundled Bounty skills directory found");

    expect(
      existsSync(path.join(projectDir, ".codex/skills/project-skill/SKILL.md"))
    ).toBe(false);
  });
});
