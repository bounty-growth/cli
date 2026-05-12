import {
  chmod,
  mkdtemp,
  mkdir,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  clearSession,
  getSessionPath,
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

  it("tightens permissions on existing session files", async () => {
    await mkdir(tempDir, { recursive: true });
    await writeFile(getSessionPath(), "{}\n", { mode: 0o644 });
    await chmod(getSessionPath(), 0o644);

    await saveSession(storedSession);

    const mode = (await stat(getSessionPath())).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("tightens permissions before reading existing session files", async () => {
    await mkdir(tempDir, { recursive: true });
    await writeFile(getSessionPath(), `${JSON.stringify(storedSession)}\n`, {
      mode: 0o644,
    });
    await chmod(getSessionPath(), 0o644);

    await expect(loadSession()).resolves.toEqual(storedSession);

    const mode = (await stat(getSessionPath())).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("rejects symlinked session files", async () => {
    const targetPath = path.join(tempDir, "target-session.json");
    await writeFile(targetPath, "{}\n", { mode: 0o600 });
    await symlink(targetPath, getSessionPath());

    await expect(saveSession(storedSession)).rejects.toThrow(
      "Refusing to write Bounty CLI session through symlink"
    );
  });

  it("rejects symlinked session files on read", async () => {
    const targetPath = path.join(tempDir, "target-session.json");
    await writeFile(targetPath, `${JSON.stringify(storedSession)}\n`, {
      mode: 0o600,
    });
    await symlink(targetPath, getSessionPath());

    await expect(loadSession()).rejects.toThrow(
      "Refusing to read Bounty CLI session through symlink"
    );
  });

  it("detects sessions that are inside the refresh window", () => {
    expect(sessionNeedsRefresh(storedSession, 1_899_999_950_000)).toBe(true);
    expect(sessionNeedsRefresh(storedSession, 1_899_000_000_000)).toBe(false);
  });
});
