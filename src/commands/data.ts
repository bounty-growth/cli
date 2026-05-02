import { Command } from "commander";

import { getAuthenticatedApiClient } from "../lib/auth";
import type {
  ActionResponse,
  ActionsListResponse,
  AdDetailResponse,
  AdsListResponse,
  AgentResponse,
  AgentsListResponse,
  CampaignDetailResponse,
  CampaignListResponse,
  CreativeAnalyticsResponse,
  CreativeFatigueResponse,
} from "../lib/api-contracts";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  writeJson,
  writeKeyValues,
  writeLine,
  writeOutput,
  writeTable,
} from "../lib/output";

type JsonOptions = {
  json?: boolean;
};

type DateRangeOptions = JsonOptions & {
  startDate?: string;
  endDate?: string;
};

type CampaignListOptions = DateRangeOptions & {
  status?: string;
  platform?: string;
};

type AdShowOptions = DateRangeOptions & {
  platform?: string;
};

type AdsListOptions = DateRangeOptions & {
  status?: string;
  sortBy?: string;
};

type ActionListOptions = JsonOptions & {
  status?: string;
  verdict?: string;
  orderBy?: string;
  includeStale?: boolean;
  full?: boolean;
};

type AgentListOptions = JsonOptions & {
  full?: boolean;
};

type ActionListItem = {
  id: string;
  title: string;
  status: string;
  verdict: string | null;
  iceScore: number | null;
  platform: string | null;
  campaignId: string | null;
  campaignName: string | null;
  owner: string | null;
  source: string | null;
  updatedAt: string;
  isStale: boolean;
};

type ActionsSummaryResponse = {
  actions: ActionListItem[];
  count: number;
};

type AgentListItem = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  trigger: string;
  outputType: string | null;
  contextCount: number;
  updatedAt: string;
};

type AgentsSummaryResponse = {
  agents: AgentListItem[];
  count: number;
};

export function registerDataCommands(program: Command) {
  registerCampaignCommands(program);
  registerAdsCommands(program);
  registerCreativesCommands(program);
  registerActionsCommands(program);
  registerAgentsCommands(program);
}

function registerCampaignCommands(program: Command) {
  const campaigns = program
    .command("campaigns")
    .description("Inspect Bounty campaigns");

  campaigns
    .command("list")
    .description("List campaigns")
    .option("--status <status>", "Filter by campaign status")
    .option("--platform <platform>", "Filter by platform")
    .option("--start-date <date>", "Start date")
    .option("--end-date <date>", "End date")
    .option("--json", "Print JSON output")
    .action(async (options: CampaignListOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<CampaignListResponse>(
        "/api/campaigns",
        {
          query: toQuery({
            status: options.status,
            platform: options.platform,
            startDate: options.startDate,
            endDate: options.endDate,
          }),
        }
      );

      writeOutput(result, options, () => {
        writeTable(result.campaigns, [
          {
            header: "ID",
            value: (campaign) => campaign.id,
          },
          { header: "Name", value: (campaign) => campaign.name },
          { header: "Status", value: (campaign) => campaign.status },
          { header: "Platform", value: (campaign) => campaign.platform },
          {
            header: "Spend",
            value: (campaign) => formatCurrency(campaign.spend),
          },
        ]);
      });
    });

  campaigns
    .command("show")
    .description("Show campaign details")
    .argument("<campaignId>", "Campaign id")
    .option("--start-date <date>", "Start date")
    .option("--end-date <date>", "End date")
    .option("--json", "Print JSON output")
    .action(async (campaignId: string, options: DateRangeOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<CampaignDetailResponse>(
        `/api/campaigns/${encodeURIComponent(campaignId)}`,
        {
          query: toQuery({
            startDate: options.startDate,
            endDate: options.endDate,
          }),
        }
      );

      writeJsonOrInspect(result, options);
    });
}

function registerAdsCommands(program: Command) {
  const ads = program.command("ads").description("Inspect ads");

  ads
    .command("list")
    .description("List ads")
    .option("--status <status>", "Filter by ad status")
    .option(
      "--sort-by <field>",
      "Sort field: spend, impressions, clicks, ctr, cpc"
    )
    .option("--start-date <date>", "Start date")
    .option("--end-date <date>", "End date")
    .option("--json", "Print JSON output")
    .action(async (options: AdsListOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<AdsListResponse>("/api/ads", {
        query: toQuery({
          status: options.status,
          sortBy: options.sortBy,
          startDate: options.startDate,
          endDate: options.endDate,
        }),
      });

      writeOutput(result, options, () => {
        writeTable(result.ads, [
          { header: "ID", value: (ad) => ad.id },
          { header: "Name", value: (ad) => ad.name },
          { header: "Campaign", value: (ad) => ad.campaignId },
          { header: "Status", value: (ad) => ad.status },
          { header: "Spend", value: (ad) => formatCurrency(ad.spend) },
          {
            header: "Impr.",
            value: (ad) =>
              formatNumber(ad.impressions, { maximumFractionDigits: 0 }),
          },
          { header: "CTR", value: (ad) => formatPercent(ad.ctr) },
          { header: "Fatigue", value: (ad) => ad.fatigueSignal },
        ]);
      });
    });

  ads
    .command("show")
    .description("Show ad details")
    .argument("<adId>", "Ad id")
    .option("--platform <platform>", "Ad platform", "facebook")
    .option("--start-date <date>", "Start date")
    .option("--end-date <date>", "End date")
    .option("--json", "Print JSON output")
    .action(async (adId: string, options: AdShowOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<AdDetailResponse>(
        `/api/ads/${encodeURIComponent(adId)}`,
        {
          query: toQuery({
            platform: options.platform,
            startDate: options.startDate,
            endDate: options.endDate,
          }),
        }
      );

      writeJsonOrInspect(result, options);
    });
}

function registerCreativesCommands(program: Command) {
  const creatives = program
    .command("creatives")
    .description("Inspect creative analytics");

  creatives
    .command("analytics")
    .description("Show creative analytics")
    .option("--start-date <date>", "Start date")
    .option("--end-date <date>", "End date")
    .option("--json", "Print JSON output")
    .action(async (options: DateRangeOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<CreativeAnalyticsResponse>(
        "/api/creative-analytics",
        {
          query: toQuery({
            startDate: options.startDate,
            endDate: options.endDate,
          }),
        }
      );

      writeOutput(result, options, () => {
        writeKeyValues({
          creatives: result.aggregates.length,
          dailyPoints: result.dailyByAd.length,
        });

        if (result.aggregates.length === 0) {
          writeLine("");
          writeLine("No creative analytics results");
          return;
        }

        writeLine("");
        writeTable(result.aggregates, [
          { header: "Ad ID", value: (ad) => ad.adId },
          { header: "Name", value: (ad) => ad.adName },
          { header: "Spend", value: (ad) => formatCurrency(ad.spend) },
          {
            header: "Impr.",
            value: (ad) =>
              formatNumber(ad.impressions, { maximumFractionDigits: 0 }),
          },
          { header: "CTR", value: (ad) => formatPercent(ad.ctr) },
          {
            header: "Hook",
            value: (ad) => formatPercent(ad.hookRate, { valueIsRatio: false }),
          },
          {
            header: "Hold",
            value: (ad) => formatPercent(ad.holdRate, { valueIsRatio: false }),
          },
        ]);
      });
    });

  creatives
    .command("fatigue")
    .description("Show daily creative fatigue for an ad")
    .argument("<adId>", "Ad id")
    .option("--start-date <date>", "Start date")
    .option("--end-date <date>", "End date")
    .option("--json", "Print JSON output")
    .action(async (adId: string, options: DateRangeOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<CreativeFatigueResponse>(
        `/api/creative-analytics/${encodeURIComponent(adId)}/fatigue`,
        {
          query: toQuery({
            startDate: options.startDate,
            endDate: options.endDate,
          }),
        }
      );

      writeOutput(result, options, () => {
        writeKeyValues({
          adId: result.adId,
          dailyPoints: result.dailyData.length,
        });

        if (result.dailyData.length === 0) {
          writeLine("");
          writeLine("No fatigue results");
          return;
        }

        writeLine("");
        writeTable(result.dailyData, [
          { header: "Date", value: (point) => point.date },
          {
            header: "Impr.",
            value: (point) =>
              formatNumber(point.impressions, { maximumFractionDigits: 0 }),
          },
          {
            header: "Frequency",
            value: (point) => formatNumber(point.frequency),
          },
          { header: "CTR", value: (point) => formatPercent(point.ctr) },
        ]);
      });
    });
}

function registerActionsCommands(program: Command) {
  const actions = program.command("actions").description("Manage actions");

  actions
    .command("list")
    .description("List actions")
    .option("--status <status>", "Filter by action status")
    .option("--verdict <verdict>", "Filter by verdict")
    .option("--order-by <field>", "Sort field")
    .option("--include-stale", "Include stale actions")
    .option("--full", "Return full raw action objects when used with --json")
    .option("--json", "Print JSON output")
    .action(async (options: ActionListOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<ActionsListResponse>("/api/actions", {
        query: toQuery({
          status: options.status,
          verdict: options.verdict,
          order_by: options.orderBy,
          include_stale: options.includeStale,
        }),
      });
      const summary = summarizeActions(result);

      writeOutput(options.full ? result : summary, options, () => {
        writeTable(summary.actions, [
          { header: "ID", value: (action) => action.id },
          { header: "Title", value: (action) => action.title },
          { header: "Status", value: (action) => action.status },
          { header: "Verdict", value: (action) => action.verdict },
          { header: "ICE", value: (action) => formatNumber(action.iceScore) },
          { header: "Platform", value: (action) => action.platform },
          { header: "Campaign", value: (action) => action.campaignName },
          { header: "Owner", value: (action) => action.owner },
        ]);
      });
    });

  actions
    .command("show")
    .description("Show action details")
    .argument("<actionId>", "Action id")
    .option("--json", "Print JSON output")
    .action(async (actionId: string, options: JsonOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<ActionResponse>(
        `/api/actions/${encodeURIComponent(actionId)}`
      );

      writeJsonOrInspect(result, options);
    });
}

function registerAgentsCommands(program: Command) {
  const agents = program.command("agents").description("Inspect agents");

  agents
    .command("list")
    .description("List agents")
    .option("--full", "Return full raw agent objects when used with --json")
    .option("--json", "Print JSON output")
    .action(async (options: AgentListOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<AgentsListResponse>("/api/agents");
      const summary = summarizeAgents(result);

      writeOutput(options.full ? result : summary, options, () => {
        writeTable(summary.agents, [
          { header: "ID", value: (agent) => agent.id },
          { header: "Name", value: (agent) => agent.name },
          { header: "Description", value: (agent) => agent.description },
          { header: "Trigger", value: (agent) => agent.trigger },
          { header: "Output", value: (agent) => agent.outputType },
          { header: "Context", value: (agent) => agent.contextCount },
        ]);
      });
    });

  agents
    .command("show")
    .description("Show agent details")
    .argument("<agentId>", "Agent id")
    .option("--json", "Print JSON output")
    .action(async (agentId: string, options: JsonOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<AgentResponse>(
        `/api/agents/${encodeURIComponent(agentId)}`
      );

      writeJsonOrInspect(result, options);
    });
}

function summarizeActions(result: ActionsListResponse): ActionsSummaryResponse {
  return {
    actions: result.actions.map((action) => ({
      id: action.id,
      title: action.title,
      status: action.status,
      verdict: action.verdict,
      iceScore: action.ice_score,
      platform: action.lever?.platform ?? null,
      campaignId: action.lever?.campaign_id ?? null,
      campaignName: action.lever?.campaign_name ?? null,
      owner: action.owner_name_override ?? action.owner_name ?? null,
      source: action.source_label ?? action.source_type,
      updatedAt: action.updated_at,
      isStale: action.is_stale ?? false,
    })),
    count: result.actions.length,
  };
}

function summarizeAgents(result: AgentsListResponse): AgentsSummaryResponse {
  return {
    agents: result.agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      isSystem: agent.is_system,
      trigger: agent.trigger,
      outputType: agent.definition.outputConfig?.type ?? null,
      contextCount: agent.definition.context?.length ?? 0,
      updatedAt: agent.updated_at,
    })),
    count: result.agents.length,
  };
}

function writeJsonOrInspect(value: unknown, options: JsonOptions) {
  if (options.json) {
    writeJson(value);
    return;
  }

  writeJson(value);
}

function toQuery(values: Record<string, string | boolean | undefined>) {
  return values;
}
