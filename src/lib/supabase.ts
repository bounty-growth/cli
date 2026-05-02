import { createClient } from "@supabase/supabase-js";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

import type { BountyConfig } from "./config";
import type { StoredSession } from "./session";

type AuthSupabaseClient = Pick<SupabaseClient, "auth">;

export function createCliSupabaseClient(config: BountyConfig) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error(
      "Missing Supabase config. Use BOUNTY_SUPABASE_URL and BOUNTY_SUPABASE_ANON_KEY for development overrides."
    );
  }

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function toStoredSession(
  session: Session,
  apiUrl: string
): StoredSession {
  if (!session.expires_at) {
    throw new Error("Supabase session did not include an expiry time");
  }

  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    userId: session.user?.id,
    apiUrl,
  };
}

export type { AuthSupabaseClient };
