import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthenticatedApiClientMock } = vi.hoisted(() => ({
  getAuthenticatedApiClientMock: vi.fn(),
}));

vi.mock("../lib/auth", () => ({
  getAuthenticatedApiClient: getAuthenticatedApiClientMock,
}));

import { createProgram } from "../program";

const requestMock = vi.fn();
let consoleLogSpy: ReturnType<typeof vi.spyOn>;

describe("tool commands", () => {
  beforeEach(() => {
    requestMock.mockReset();
    getAuthenticatedApiClientMock.mockResolvedValue({
      client: {
        request: requestMock,
      },
    });
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it("runs campaign analysis", async () => {
    requestMock.mockResolvedValue({
      analysis: {
        summary: "Done",
        generatedAt: "2026-04-30T00:00:00.000Z",
        campaign: {
          id: "facebook:campaign_123",
          name: "Prospecting",
          status: "active",
          platform: "facebook",
          spend: 100,
          conversions: 10,
          roas: 2,
          ctr: 0.02,
          cpc: 1,
        },
        findings: [],
      },
    });

    await createProgram().parseAsync([
      "node",
      "bounty",
      "campaign",
      "analyze",
      "facebook:campaign_123",
      "--start-date",
      "2026-04-01",
      "--end-date",
      "2026-04-30",
      "--wait",
    ]);

    expect(requestMock).toHaveBeenCalledWith("/api/tools/campaign-analysis", {
      method: "POST",
      body: {
        campaignId: "facebook:campaign_123",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      },
    });
  });
});
