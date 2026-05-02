import { describe, expect, it } from "vitest";

import { buildSkillsInstallArgs } from "./skills-install";

describe("skills install arguments", () => {
  it("builds the default non-interactive install command", () => {
    expect(
      buildSkillsInstallArgs({
        all: true,
        global: true,
        yes: true,
        includeNpxYes: true,
      })
    ).toEqual([
      "npx",
      "-y",
      "skills",
      "add",
      "bounty-growth/cli",
      "--full-depth",
      "--global",
      "--all",
      "--yes",
    ]);
  });

  it("targets one agent instead of all agents", () => {
    expect(
      buildSkillsInstallArgs({
        agent: "codex",
        yes: true,
        includeNpxYes: true,
      })
    ).toEqual([
      "npx",
      "-y",
      "skills",
      "add",
      "bounty-growth/cli",
      "--full-depth",
      "--global",
      "--agent",
      "codex",
      "--yes",
    ]);
  });

  it("can omit global and confirmation flags", () => {
    expect(
      buildSkillsInstallArgs({
        global: false,
        all: true,
      })
    ).toEqual([
      "npx",
      "skills",
      "add",
      "bounty-growth/cli",
      "--full-depth",
      "--all",
    ]);
  });
});
