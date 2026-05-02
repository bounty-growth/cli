import { describe, expect, it, vi } from "vitest";

import { handleInitCommand } from "./init";

const config = {
  apiUrl: "http://localhost:3000",
  supabaseUrl: "http://supabase.test",
  supabaseAnonKey: "anon-key",
};

const session = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  expiresAt: 1_900_000_000,
  userId: "user_123",
  apiUrl: config.apiUrl,
};

describe("init command", () => {
  it("installs skills before browser login", async () => {
    const calls: string[] = [];
    const installSkills = vi.fn(async () => {
      calls.push("skills");
    });
    const signInWithBrowser = vi.fn(async () => {
      calls.push("auth");
      return session;
    });

    await handleInitCommand(
      {
        all: true,
        browser: true,
      },
      {
        installSkills,
        getEffectiveConfig: vi.fn(async () => config),
        signInWithBrowser,
        writeLine: vi.fn(),
      }
    );

    expect(calls).toEqual(["skills", "auth"]);
    expect(installSkills).toHaveBeenCalledWith({
      agent: undefined,
      all: true,
      global: undefined,
      yes: true,
    });
    expect(signInWithBrowser).toHaveBeenCalledWith(
      expect.objectContaining({
        config,
        onAuthorizeUrl: expect.any(Function),
      })
    );
  });

  it("respects skip flags", async () => {
    const installSkills = vi.fn();
    const signInWithBrowser = vi.fn();

    await handleInitCommand(
      {
        skipAuth: true,
        skipSkills: true,
      },
      {
        installSkills,
        getEffectiveConfig: vi.fn(async () => config),
        signInWithBrowser,
        writeLine: vi.fn(),
      }
    );

    expect(installSkills).not.toHaveBeenCalled();
    expect(signInWithBrowser).not.toHaveBeenCalled();
  });

  it("does not default to all-agent skill installs", async () => {
    const installSkills = vi.fn();

    await handleInitCommand(
      {
        skipAuth: true,
      },
      {
        installSkills,
        getEffectiveConfig: vi.fn(async () => config),
        signInWithBrowser: vi.fn(),
        writeLine: vi.fn(),
      }
    );

    expect(installSkills).toHaveBeenCalledWith({
      agent: undefined,
      all: undefined,
      global: undefined,
      yes: true,
    });
  });
});
