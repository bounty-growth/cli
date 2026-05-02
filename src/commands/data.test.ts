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

describe("data commands", () => {
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

  it("calls the campaigns list API with filters", async () => {
    requestMock.mockResolvedValue({ campaigns: [] });

    await createProgram().parseAsync([
      "node",
      "bounty",
      "campaigns",
      "list",
      "--status",
      "active",
      "--platform",
      "facebook",
      "--start-date",
      "2026-04-01",
      "--end-date",
      "2026-04-30",
    ]);

    expect(requestMock).toHaveBeenCalledWith("/api/campaigns", {
      query: {
        status: "active",
        platform: "facebook",
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      },
    });
  });

  it("calls the ads list API with date filters", async () => {
    requestMock.mockResolvedValue({ ads: [] });

    await createProgram().parseAsync([
      "node",
      "bounty",
      "ads",
      "list",
      "--start-date",
      "2026-04-01",
      "--end-date",
      "2026-04-30",
      "--status",
      "ACTIVE",
    ]);

    expect(requestMock).toHaveBeenCalledWith("/api/ads", {
      query: {
        status: "ACTIVE",
        sortBy: undefined,
        startDate: "2026-04-01",
        endDate: "2026-04-30",
      },
    });
  });

  it("calls the creative fatigue API", async () => {
    requestMock.mockResolvedValue({ adId: "ad_123", dailyData: [] });

    await createProgram().parseAsync([
      "node",
      "bounty",
      "creatives",
      "fatigue",
      "ad_123",
      "--start-date",
      "2026-04-01",
      "--end-date",
      "2026-04-30",
    ]);

    expect(requestMock).toHaveBeenCalledWith(
      "/api/creative-analytics/ad_123/fatigue",
      {
        query: {
          startDate: "2026-04-01",
          endDate: "2026-04-30",
        },
      }
    );
  });

  it("prints concise action JSON by default", async () => {
    requestMock.mockResolvedValue({
      actions: [
        {
          id: "action_123",
          title: "Scale winners",
          status: "backlog",
          verdict: null,
          ice_score: 20,
          lever: {
            platform: "Meta",
            campaign_id: "campaign_123",
            campaign_name: "Prospecting",
          },
          owner_name: "Arran",
          owner_name_override: null,
          source_label: null,
          source_type: "manual",
          updated_at: "2026-04-30T00:00:00.000Z",
          is_stale: false,
          analysis_snapshot: { noisy: true },
        },
      ],
    });

    await createProgram().parseAsync([
      "node",
      "bounty",
      "actions",
      "list",
      "--json",
    ]);

    expect(requestMock).toHaveBeenCalledWith("/api/actions", {
      query: {
        status: undefined,
        verdict: undefined,
        order_by: undefined,
        include_stale: undefined,
      },
    });
    expect(JSON.parse(consoleLogSpy.mock.calls[0][0])).toEqual({
      actions: [
        {
          id: "action_123",
          title: "Scale winners",
          status: "backlog",
          verdict: null,
          iceScore: 20,
          platform: "Meta",
          campaignId: "campaign_123",
          campaignName: "Prospecting",
          owner: "Arran",
          source: "manual",
          updatedAt: "2026-04-30T00:00:00.000Z",
          isStale: false,
        },
      ],
      count: 1,
    });
  });

  it("keeps full action JSON behind --full", async () => {
    const fullResponse = {
      actions: [
        {
          id: "action_123",
          title: "Scale winners",
          status: "backlog",
          analysis_snapshot: { retained: true },
        },
      ],
    };
    requestMock.mockResolvedValue(fullResponse);

    await createProgram().parseAsync([
      "node",
      "bounty",
      "actions",
      "list",
      "--full",
      "--json",
    ]);

    expect(JSON.parse(consoleLogSpy.mock.calls[0][0])).toEqual(fullResponse);
  });

  it("shows action details through the API", async () => {
    requestMock.mockResolvedValue({ action: { id: "action_123" } });

    await createProgram().parseAsync([
      "node",
      "bounty",
      "actions",
      "show",
      "action_123",
    ]);

    expect(requestMock).toHaveBeenCalledWith("/api/actions/action_123");
  });

  it("prints concise agent JSON by default", async () => {
    requestMock.mockResolvedValue({
      agents: [
        {
          id: "agent_123",
          name: "Daily Pulse",
          description: "Daily check",
          is_system: true,
          trigger: "manual",
          definition: {
            prompt: "Summarize",
            context: [{ type: "all_metrics", id: "all", name: "All" }],
            outputConfig: { type: "report" },
          },
          updated_at: "2026-04-30T00:00:00.000Z",
        },
      ],
    });

    await createProgram().parseAsync([
      "node",
      "bounty",
      "agents",
      "list",
      "--json",
    ]);

    expect(JSON.parse(consoleLogSpy.mock.calls[0][0])).toEqual({
      agents: [
        {
          id: "agent_123",
          name: "Daily Pulse",
          description: "Daily check",
          isSystem: true,
          trigger: "manual",
          outputType: "report",
          contextCount: 1,
          updatedAt: "2026-04-30T00:00:00.000Z",
        },
      ],
      count: 1,
    });
  });

  it("shows agent details through the API", async () => {
    requestMock.mockResolvedValue({ agent: { id: "agent_123" } });

    await createProgram().parseAsync([
      "node",
      "bounty",
      "agents",
      "show",
      "agent_123",
    ]);

    expect(requestMock).toHaveBeenCalledWith("/api/agents/agent_123");
  });
});
