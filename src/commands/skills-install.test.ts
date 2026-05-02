import { describe, expect, it, vi } from "vitest";

import { installSkills } from "./skills-install";

describe("skills install", () => {
  it("uses the bundled native installer by default", async () => {
    const installSkillsNative = vi.fn();

    await installSkills(
      {
        agent: "codex",
        global: false,
      },
      {
        installSkillsNative,
      }
    );

    expect(installSkillsNative).toHaveBeenCalledWith({
      agent: "codex",
      all: undefined,
      global: false,
    });
  });

  it("requires all-agent installs to be explicitly requested by the caller", async () => {
    const installSkillsNative = vi.fn();

    await installSkills(
      {
        global: true,
      },
      {
        installSkillsNative,
      }
    );

    expect(installSkillsNative).toHaveBeenCalledWith({
      agent: undefined,
      all: undefined,
      global: true,
    });
  });
});
