import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { z } from "zod";

import {
  DEFAULT_BOUNTY_API_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_URL,
} from "./defaults";

const configSchema = z
  .object({
    apiUrl: z.string().url().optional(),
    supabaseUrl: z.string().url().optional(),
    supabaseAnonKey: z.string().min(1).optional(),
  })
  .passthrough();

export type BountyConfig = z.infer<typeof configSchema>;

export function getConfigDir() {
  return (
    process.env.BOUNTY_CLI_CONFIG_DIR ??
    path.join(
      process.env.XDG_CONFIG_HOME ?? path.join(homedir(), ".config"),
      "bounty"
    )
  );
}

export function getConfigPath() {
  return path.join(getConfigDir(), "config.json");
}

export async function loadConfig(): Promise<BountyConfig> {
  try {
    const raw = await readFile(getConfigPath(), "utf8");
    return configSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return {};
    }

    throw error;
  }
}

export async function saveConfig(config: BountyConfig) {
  const parsed = configSchema.parse(config);
  await mkdir(getConfigDir(), { recursive: true, mode: 0o700 });
  await writeFile(getConfigPath(), `${JSON.stringify(parsed, null, 2)}\n`, {
    mode: 0o600,
  });
}

export async function updateConfig(
  updater: (config: BountyConfig) => BountyConfig
) {
  const current = await loadConfig();
  const next = updater(current);
  await saveConfig(next);
  return next;
}

export async function getEffectiveConfig() {
  const config = await loadConfig();
  const apiUrl = normalizeApiUrl(
    process.env.BOUNTY_API_URL ?? config.apiUrl ?? DEFAULT_BOUNTY_API_URL
  );
  const shouldUseNextEnvSupabase = isLocalUrl(apiUrl);

  return {
    ...config,
    apiUrl,
    supabaseUrl:
      process.env.BOUNTY_SUPABASE_URL ??
      config.supabaseUrl ??
      (shouldUseNextEnvSupabase
        ? process.env.NEXT_PUBLIC_SUPABASE_URL
        : undefined) ??
      DEFAULT_SUPABASE_URL,
    supabaseAnonKey:
      process.env.BOUNTY_SUPABASE_ANON_KEY ??
      config.supabaseAnonKey ??
      (shouldUseNextEnvSupabase
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        : undefined) ??
      DEFAULT_SUPABASE_ANON_KEY,
  };
}

export function normalizeApiUrl(value: string) {
  const url = new URL(value);
  const normalized = url.toString().replace(/\/$/, "");

  if (url.protocol === "https:") {
    return normalized;
  }

  if (url.protocol === "http:" && isLocalUrl(normalized)) {
    return normalized;
  }

  throw new Error(
    "Invalid Bounty API URL. Use https:// URLs, or http://localhost / http://127.0.0.1 for local development."
  );
}

export function formatConfig(
  config: Awaited<ReturnType<typeof getEffectiveConfig>>
) {
  return {
    apiUrl: config.apiUrl,
    supabaseUrl: config.supabaseUrl,
    hasSupabaseAnonKey: Boolean(config.supabaseAnonKey),
  };
}

function isLocalUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}
