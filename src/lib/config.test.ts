import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_BOUNTY_API_URL, DEFAULT_SUPABASE_URL } from "./defaults";
import {
  formatConfig,
  getConfigPath,
  getEffectiveConfig,
  loadConfig,
  saveConfig,
} from "./config";

let tempDir: string;

describe("CLI config", () => {
  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), "bounty-cli-"));
    process.env.BOUNTY_CLI_CONFIG_DIR = tempDir;
    delete process.env.BOUNTY_API_URL;
    delete process.env.BOUNTY_SUPABASE_URL;
    delete process.env.BOUNTY_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
    delete process.env.BOUNTY_CLI_CONFIG_DIR;
  });

  it("loads an empty config when no file exists", async () => {
    await expect(loadConfig()).resolves.toEqual({});
    expect(getConfigPath()).toBe(path.join(tempDir, "config.json"));
  });

  it("saves config to the configured directory", async () => {
    await saveConfig({ apiUrl: "http://localhost:3000" });

    await expect(loadConfig()).resolves.toEqual({
      apiUrl: "http://localhost:3000",
    });
  });

  it("uses environment values ahead of saved config", async () => {
    await saveConfig({
      apiUrl: "https://saved.test",
      supabaseUrl: "http://saved-supabase.test",
      supabaseAnonKey: "saved-anon",
    });

    process.env.BOUNTY_API_URL = "https://env.test";
    process.env.BOUNTY_SUPABASE_URL = "http://env-supabase.test";
    process.env.BOUNTY_SUPABASE_ANON_KEY = "env-anon";

    await expect(getEffectiveConfig()).resolves.toMatchObject({
      apiUrl: "https://env.test",
      supabaseUrl: "http://env-supabase.test",
      supabaseAnonKey: "env-anon",
    });
  });

  it("defaults to the production Bounty API and Supabase project", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://local-supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "local-anon";

    await expect(getEffectiveConfig()).resolves.toMatchObject({
      apiUrl: DEFAULT_BOUNTY_API_URL,
      supabaseUrl: DEFAULT_SUPABASE_URL,
      supabaseAnonKey: expect.any(String),
    });
  });

  it("rejects non-local HTTP API URLs", async () => {
    process.env.BOUNTY_API_URL = "http://example.com";

    await expect(getEffectiveConfig()).rejects.toThrow(
      "Invalid Bounty API URL"
    );
  });

  it("allows HTTPS API URLs", async () => {
    process.env.BOUNTY_API_URL = "https://staging.bountygrowth.com";

    await expect(getEffectiveConfig()).resolves.toMatchObject({
      apiUrl: "https://staging.bountygrowth.com",
    });
  });

  it("uses local Next Supabase env when the API URL is local", async () => {
    process.env.BOUNTY_API_URL = "http://localhost:3000";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://local-supabase.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "local-anon";

    await expect(getEffectiveConfig()).resolves.toMatchObject({
      apiUrl: "http://localhost:3000",
      supabaseUrl: "http://local-supabase.test",
      supabaseAnonKey: "local-anon",
    });
  });

  it("formats config without printing the Supabase anon key", async () => {
    expect(
      formatConfig({
        apiUrl: "http://localhost:3000",
        supabaseUrl: "http://supabase.test",
        supabaseAnonKey: "anon-key",
      })
    ).toEqual({
      apiUrl: "http://localhost:3000",
      supabaseUrl: "http://supabase.test",
      hasSupabaseAnonKey: true,
    });
  });
});
