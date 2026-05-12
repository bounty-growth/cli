import { describe, expect, it, vi } from "vitest";

import { BountyApiClient } from "./api-client";
import { BountyApiError, redactSensitiveText } from "./errors";

describe("BountyApiClient", () => {
  it("injects bearer tokens and query params", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      })
    );
    const client = new BountyApiClient({
      baseUrl: "http://localhost:3000",
      getAccessToken: () => "token_123",
      fetchImpl,
    });

    await expect(
      client.request("/api/campaigns", {
        query: { status: "active", empty: undefined },
      })
    ).resolves.toEqual({ ok: true });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url.toString()).toBe(
      "http://localhost:3000/api/campaigns?status=active"
    );
    expect(init.headers.get("authorization")).toBe("Bearer token_123");
  });

  it("throws API errors with response bodies", async () => {
    const client = new BountyApiClient({
      baseUrl: "http://localhost:3000",
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "nope" }), {
          status: 401,
          headers: { "content-type": "application/json" },
        })
      ),
    });

    await expect(client.request("/api/cli/whoami")).rejects.toMatchObject({
      status: 401,
      body: { error: "nope" },
    } satisfies Partial<BountyApiError>);
  });

  it("redacts tokens from error output", () => {
    expect(
      redactSensitiveText(
        "failed with Bearer token_123 and access_token=abc123"
      )
    ).toBe("failed with Bearer [redacted] and access_token=[redacted]");

    const redacted = redactSensitiveText({
      accessToken: "camel_access_token",
      refreshToken: "camel_refresh_token",
    });

    expect(redacted).toContain('"accessToken": "[redacted]"');
    expect(redacted).toContain('"refreshToken": "[redacted]"');
    expect(redacted).not.toContain("camel_access_token");
    expect(redacted).not.toContain("camel_refresh_token");
  });
});
