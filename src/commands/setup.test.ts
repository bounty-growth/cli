import { describe, expect, it, vi } from "vitest";

import { handleSetupCommand } from "./setup";

describe("setup command", () => {
  it("installs skills for a specific agent", async () => {
    const installSkills = vi.fn();

    await handleSetupCommand(
      "skills",
      {
        agent: "codex",
      },
      {
        installSkills,
      }
    );

    expect(installSkills).toHaveBeenCalledWith({
      agent: "codex",
      all: undefined,
      global: undefined,
      yes: undefined,
    });
  });

  it("does not make global installs implicit", async () => {
    const installSkills = vi.fn();

    await handleSetupCommand(
      "skills",
      {},
      {
        installSkills,
      }
    );

    expect(installSkills).toHaveBeenCalledWith({
      agent: undefined,
      all: undefined,
      global: undefined,
      yes: undefined,
    });
  });

  it("rejects unsupported setup subcommands", async () => {
    await expect(
      handleSetupCommand("mcp" as never, {}, { installSkills: vi.fn() })
    ).rejects.toThrow("Unknown setup subcommand");
  });
});
