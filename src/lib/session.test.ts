import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearSession,
  loadSession,
  saveSession,
  sessionNeedsRefresh,
  type StoredSession,
} from "./session";

let tempDir: string;

const storedSession: StoredSession = {
  accessToken: "access_token_123",
  refreshToken: "refresh_token_123",
  expiresAt: 1_900_000_000,
  userId: "user_123",
  apiUrl: "http://localhost:3000",
};

describe("CLI session storage", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "bounty-cli-session-"));
    process.env.BOUNTY_CLI_CONFIG_DIR = tempDir;
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    delete process.env.BOUNTY_CLI_CONFIG_DIR;
  });

  it("saves, loads, and clears the local session", async () => {
    await expect(loadSession()).resolves.toBeNull();

    await saveSession(storedSession);
    await expect(loadSession()).resolves.toEqual(storedSession);

    await clearSession();
    await expect(loadSession()).resolves.toBeNull();
  });

  it("detects sessions that are inside the refresh window", () => {
    expect(sessionNeedsRefresh(storedSession, 1_899_999_950_000)).toBe(true);
    expect(sessionNeedsRefresh(storedSession, 1_899_000_000_000)).toBe(false);
  });
});
