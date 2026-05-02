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
  const { readFile } = await import("node:fs/promises");

  try {
    const raw = await readFile(getSessionPath(), "utf8");
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
  const { mkdir, writeFile } = await import("node:fs/promises");

  await mkdir(getConfigDir(), { recursive: true, mode: 0o700 });
  await writeFile(
    getSessionPath(),
    `${JSON.stringify(sessionSchema.parse(session), null, 2)}\n`,
    { mode: 0o600 }
  );

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
