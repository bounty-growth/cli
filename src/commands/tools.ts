import { Command } from "commander";

import { getAuthenticatedApiClient } from "../lib/auth";
import type { CampaignAnalysisToolResponse } from "../lib/api-contracts";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  writeKeyValues,
  writeOutput,
  writeTable,
} from "../lib/output";

type JsonOptions = {
  json?: boolean;
};

type CampaignAnalyzeOptions = JsonOptions & {
  startDate?: string;
  endDate?: string;
  wait?: boolean;
};

export function registerToolCommands(program: Command) {
  registerCampaignToolCommands(program);
}

function registerCampaignToolCommands(program: Command) {
  const campaign = program
    .command("campaign")
    .description("Run campaign-focused marketing tools");

  campaign
    .command("analyze")
    .description("Analyze a campaign and return prioritized findings")
    .argument("<campaignId>", "Campaign id")
    .option("--start-date <date>", "Start date")
    .option("--end-date <date>", "End date")
    .option("--wait", "Wait for analysis to complete")
    .option("--json", "Print JSON output")
    .action(async (campaignId: string, options: CampaignAnalyzeOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const result = await client.request<CampaignAnalysisToolResponse>(
        "/api/tools/campaign-analysis",
        {
          method: "POST",
          body: {
            campaignId,
            startDate: options.startDate,
            endDate: options.endDate,
          },
        }
      );

      writeCampaignAnalysis(result, options);
    });
}

function writeCampaignAnalysis(
  result: CampaignAnalysisToolResponse,
  options: JsonOptions
) {
  writeOutput(result, options, () => {
    const { analysis } = result;

    writeKeyValues({
      campaign: analysis.campaign.name,
      campaignId: analysis.campaign.id,
      platform: analysis.campaign.platform,
      spend: formatCurrency(analysis.campaign.spend),
      conversions: formatNumber(analysis.campaign.conversions, {
        maximumFractionDigits: 0,
      }),
      roas: formatNumber(analysis.campaign.roas),
      ctr: formatPercent(analysis.campaign.ctr),
      cpc: formatCurrency(analysis.campaign.cpc),
      generatedAt: analysis.generatedAt,
    });

    if (analysis.summary) {
      console.log("");
      console.log(analysis.summary);
    }

    if (analysis.findings.length) {
      console.log("");
      writeTable(analysis.findings, [
        { header: "Severity", value: (finding) => finding.severity },
        { header: "Metric", value: (finding) => finding.metric },
        { header: "Finding", value: (finding) => finding.title },
        { header: "Evidence", value: (finding) => finding.evidence },
        {
          header: "Recommendation",
          value: (finding) => finding.recommendation,
        },
        { header: "Confidence", value: (finding) => finding.confidence },
      ]);
    }
  });
}
