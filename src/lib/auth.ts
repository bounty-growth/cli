import { createServer } from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";

import { BountyApiClient } from "./api-client";
import type { CliSessionResponse } from "./api-contracts";
import type { BountyConfig } from "./config";
import { getEffectiveConfig } from "./config";
import {
  loadSession,
  saveSession,
  sessionNeedsRefresh,
  type StoredSession,
} from "./session";
import {
  createCliSupabaseClient,
  toStoredSession,
  type AuthSupabaseClient,
} from "./supabase";

const DEFAULT_BROWSER_LOGIN_TIMEOUT_MS = 5 * 60 * 1000;

export type SignInOptions = {
  email: string;
  password: string;
  config: BountyConfig & { apiUrl: string };
  supabase?: AuthSupabaseClient;
};

export async function signInWithPassword({
  email,
  password,
  config,
  supabase = createCliSupabaseClient(config),
}: SignInOptions) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(error?.message ?? "Supabase did not return a session");
  }

  const session = toStoredSession(data.session, config.apiUrl);
  await saveSession(session);
  return session;
}

export type BrowserSignInOptions = {
  config: BountyConfig & { apiUrl: string };
  fetchImpl?: typeof fetch;
  openBrowser?: (url: string) => Promise<void>;
  onAuthorizeUrl?: (url: string) => void;
  timeoutMs?: number;
};

export async function signInWithBrowser({
  config,
  fetchImpl,
  openBrowser = openUrlInBrowser,
  onAuthorizeUrl,
  timeoutMs = DEFAULT_BROWSER_LOGIN_TIMEOUT_MS,
}: BrowserSignInOptions) {
  const state = randomBytes(24).toString("base64url");
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);
  const client = new BountyApiClient({
    baseUrl: config.apiUrl,
    fetchImpl,
  });
  const server = createServer();

  const session = await new Promise<StoredSession>((resolve, reject) => {
    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for browser login"));
    }, timeoutMs);

    server.on("request", (request, response) => {
      const requestUrl = new URL(
        request.url ?? "/",
        `http://${request.headers.host}`
      );

      if (requestUrl.pathname !== "/callback") {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      const callbackState = requestUrl.searchParams.get("state");
      const code = requestUrl.searchParams.get("code");

      if (callbackState !== state) {
        response.writeHead(400);
        response.end("Invalid Bounty CLI login state.");
        return;
      }

      if (!code) {
        response.writeHead(400);
        response.end("Missing Bounty CLI authorization code.");
        return;
      }

      void exchangeCodeForSession(code)
        .then((exchangedSession) => {
          response.writeHead(200, {
            "content-type": "text/html; charset=utf-8",
          });
          response.end(
            "<html><body><h1>Bounty CLI login complete</h1><p>You can close this tab.</p></body></html>"
          );

          clearTimeout(timeout);
          server.close();
          resolve(exchangedSession);
        })
        .catch((error) => {
          response.writeHead(500);
          response.end("Unable to complete Bounty CLI login.");
          clearTimeout(timeout);
          server.close();
          reject(error);
        });
    });

    server.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        clearTimeout(timeout);
        server.close();
        reject(new Error("Unable to start local Bounty CLI callback server"));
        return;
      }

      const redirectUri = `http://127.0.0.1:${address.port}/callback`;
      const authorizeUrl = new URL("/cli/authorize", config.apiUrl);
      authorizeUrl.searchParams.set("redirect_uri", redirectUri);
      authorizeUrl.searchParams.set("state", state);
      authorizeUrl.searchParams.set("code_challenge", codeChallenge);

      onAuthorizeUrl?.(authorizeUrl.toString());
      void openBrowser(authorizeUrl.toString()).catch(() => undefined);
    });

    async function exchangeCodeForSession(code: string) {
      const { session: apiSession } = await client.request<CliSessionResponse>(
        "/api/cli/token",
        {
          method: "POST",
          body: {
            code,
            codeVerifier,
          },
        }
      );

      return {
        ...apiSession,
        apiUrl: config.apiUrl,
      };
    }
  });

  await saveSession(session);
  return session;
}

function createCodeVerifier() {
  return randomBytes(32).toString("base64url");
}

function createCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export type RefreshOptions = {
  config: BountyConfig & { apiUrl: string };
  session?: StoredSession | null;
  supabase?: AuthSupabaseClient;
};

export async function refreshStoredSession({
  config,
  session = null,
  supabase,
}: RefreshOptions) {
  const currentSession = session ?? (await loadSession());

  if (!currentSession) {
    throw new Error("Not logged in. Run `bounty-cli login` first.");
  }

  if (!sessionNeedsRefresh(currentSession)) {
    return currentSession;
  }

  const authClient = supabase ?? createCliSupabaseClient(config);
  const { data, error } = await authClient.auth.refreshSession({
    refresh_token: currentSession.refreshToken,
  });

  if (error || !data.session) {
    throw new Error(error?.message ?? "Unable to refresh Supabase session");
  }

  const refreshed = toStoredSession(data.session, config.apiUrl);
  await saveSession(refreshed);
  return refreshed;
}

export async function getAuthenticatedApiClient(fetchImpl?: typeof fetch) {
  const config = await getEffectiveConfig();
  const session = await refreshStoredSession({ config });

  return {
    config,
    session,
    client: new BountyApiClient({
      baseUrl: config.apiUrl,
      getAccessToken: () => session.accessToken,
      fetchImpl,
    }),
  };
}

export async function openUrlInBrowser(url: string) {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      detached: true,
      stdio: "ignore",
    });

    child.on("error", reject);
    child.on("spawn", () => {
      child.unref();
      resolve();
    });
  });
}
