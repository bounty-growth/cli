import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { loadSession, saveSession, type StoredSession } from "./session";
import {
  refreshStoredSession,
  signInWithBrowser,
} from "./auth";

let tempDir: string;

const config = {
  apiUrl: "http://localhost:3000",
  supabaseUrl: "http://supabase.test",
  supabaseAnonKey: "anon-key",
};

function buildSupabaseSession({
  accessToken = "access_token_123",
  refreshToken = "refresh_token_123",
  expiresAt = 1_900_000_000,
  userId = "user_123",
} = {}) {
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    user: { id: userId },
  };
}

describe("CLI auth", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "bounty-cli-auth-"));
    process.env.BOUNTY_CLI_CONFIG_DIR = tempDir;
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    delete process.env.BOUNTY_CLI_CONFIG_DIR;
  });

  it("stores a browser-authorized Supabase session", async () => {
    const openBrowser = vi.fn(async (authorizeUrl: string) => {
      const url = new URL(authorizeUrl);
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");

      const callbackUrl = new URL(url.searchParams.get("redirect_uri")!);
      callbackUrl.searchParams.set("state", url.searchParams.get("state")!);
      callbackUrl.searchParams.set("code", "auth_code_123");

      await fetch(callbackUrl);
    });
    const fetchImpl = vi.fn(async (url, init) => {
      expect(String(url)).toBe("http://localhost:3000/api/cli/token");
      expect(JSON.parse(String(init?.body))).toMatchObject({
        code: "auth_code_123",
        codeVerifier: expect.any(String),
        redirectUri: expect.stringMatching(
          /^http:\/\/127\.0\.0\.1:\d+\/callback$/
        ),
      });

      return new Response(
        JSON.stringify({
          session: {
            accessToken: "browser_access_token",
            refreshToken: "browser_refresh_token",
            expiresAt: 1_900_000_000,
            userId: "user_123",
          },
        }),
        { headers: { "content-type": "application/json" } }
      );
    }) as typeof fetch;
    const authorizeUrls: string[] = [];

    const session = await signInWithBrowser({
      config,
      fetchImpl,
      openBrowser,
      onAuthorizeUrl: (url) => authorizeUrls.push(url),
      timeoutMs: 1000,
    });

    expect(openBrowser).toHaveBeenCalledTimes(1);
    expect(authorizeUrls[0]).toContain("/cli/authorize");
    expect(authorizeUrls[0]).toContain("code_challenge=");
    expect(authorizeUrls[0]).toContain("code_challenge_method=S256");
    expect(authorizeUrls[0]).not.toContain("access_token");
    expect(authorizeUrls[0]).not.toContain("refresh_token");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(session).toMatchObject({
      accessToken: "browser_access_token",
      refreshToken: "browser_refresh_token",
      expiresAt: 1_900_000_000,
      userId: "user_123",
      apiUrl: "http://localhost:3000",
    });
    await expect(loadSession()).resolves.toEqual(session);
  });

  it("returns a valid stored session without refreshing", async () => {
    const storedSession: StoredSession = {
      accessToken: "access_token_123",
      refreshToken: "refresh_token_123",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      userId: "user_123",
      apiUrl: config.apiUrl,
    };
    const refreshSessionMock = vi.fn();

    await saveSession(storedSession);

    await expect(
      refreshStoredSession({
        config,
        supabase: { auth: { refreshSession: refreshSessionMock } } as never,
      })
    ).resolves.toEqual(storedSession);
    expect(refreshSessionMock).not.toHaveBeenCalled();
  });

  it("rejects stored sessions for a different API origin before reuse", async () => {
    const storedSession: StoredSession = {
      accessToken: "access_token_123",
      refreshToken: "refresh_token_123",
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
      userId: "user_123",
      apiUrl: "http://localhost:3000",
    };
    const refreshSessionMock = vi.fn();

    await expect(
      refreshStoredSession({
        config: {
          ...config,
          apiUrl: "https://api.example.com",
        },
        session: storedSession,
        supabase: { auth: { refreshSession: refreshSessionMock } } as never,
      })
    ).rejects.toThrow("Stored Bounty CLI session is for");

    expect(refreshSessionMock).not.toHaveBeenCalled();
  });

  it("refreshes expired sessions and persists the replacement", async () => {
    await saveSession({
      accessToken: "old_access_token",
      refreshToken: "old_refresh_token",
      expiresAt: Math.floor(Date.now() / 1000) - 60,
      userId: "user_123",
      apiUrl: config.apiUrl,
    });
    const refreshSessionMock = vi.fn().mockResolvedValue({
      data: {
        session: buildSupabaseSession({
          accessToken: "new_access_token",
          refreshToken: "new_refresh_token",
        }),
      },
      error: null,
    });

    const session = await refreshStoredSession({
      config,
      supabase: { auth: { refreshSession: refreshSessionMock } } as never,
    });

    expect(refreshSessionMock).toHaveBeenCalledWith({
      refresh_token: "old_refresh_token",
    });
    expect(session.accessToken).toBe("new_access_token");
    await expect(loadSession()).resolves.toMatchObject({
      accessToken: "new_access_token",
      refreshToken: "new_refresh_token",
    });
  });
});
