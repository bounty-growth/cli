import { rm } from "node:fs/promises";
import { z } from "zod";

import {
  getConfigDir,
  getEffectiveConfig,
  getConfigPath,
  saveConfig,
} from "./config";

const sessionSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
  userId: z.string().optional(),
  apiUrl: z.string().url(),
});

export type StoredSession = z.infer<typeof sessionSchema>;

export function getSessionPath() {
  return getConfigPath().replace(/config\.json$/, "session.json");
}

export async function loadSession(): Promise<StoredSession | null> {
  const { chmod, lstat, readFile } = await import("node:fs/promises");
  const sessionPath = getSessionPath();

  try {
    const stat = await lstat(sessionPath);
    if (stat.isSymbolicLink()) {
      throw new Error(
        `Refusing to read Bounty CLI session through symlink: ${sessionPath}`
      );
    }
    if (!stat.isFile()) {
      throw new Error(
        `Refusing to read non-file Bounty CLI session: ${sessionPath}`
      );
    }
    if ((stat.mode & 0o077) !== 0) {
      await chmod(sessionPath, 0o600);
    }

    const raw = await readFile(sessionPath, "utf8");
    return sessionSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return null;
    }

    throw error;
  }
}

export async function saveSession(session: StoredSession) {
  const { chmod, lstat, mkdir, rename, rm: removeFile, writeFile } =
    await import("node:fs/promises");
  const sessionPath = getSessionPath();
  const tempPath = `${sessionPath}.${process.pid}.${Date.now()}.tmp`;

  await mkdir(getConfigDir(), { recursive: true, mode: 0o700 });

  try {
    const stat = await lstat(sessionPath);
    if (stat.isSymbolicLink()) {
      throw new Error(
        `Refusing to write Bounty CLI session through symlink: ${sessionPath}`
      );
    }
  } catch (error) {
    if (!isNodeError(error, "ENOENT")) {
      throw error;
    }
  }

  try {
    await writeFile(
      tempPath,
      `${JSON.stringify(sessionSchema.parse(session), null, 2)}\n`,
      { mode: 0o600, flag: "wx" }
    );
    await chmod(tempPath, 0o600);
    await rename(tempPath, sessionPath);

    const stat = await lstat(sessionPath);
    if (stat.isSymbolicLink()) {
      throw new Error(
        `Refusing to write Bounty CLI session through symlink: ${sessionPath}`
      );
    }
    await chmod(sessionPath, 0o600);
  } catch (error) {
    await removeFile(tempPath, { force: true });
    throw error;
  }

  const config = await getEffectiveConfig();
  await saveConfig({
    apiUrl: config.apiUrl,
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
  });
}

export async function clearSession() {
  await rm(getSessionPath(), { force: true });
}

export function sessionNeedsRefresh(
  session: StoredSession,
  now = Date.now(),
  skewMs = 60_000
) {
  return session.expiresAt * 1000 - now <= skewMs;
}

function isNodeError(error: unknown, code: string) {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    error.code === code
  );
}
