export type CliSessionResponse = {
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
    userId: string;
  };
};

export type CliWhoamiResponse = {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    id: string;
    email: string | null;
    fullName: string | null;
    isSuperAdmin: boolean;
  };
  organization: {
    id: string;
    name: string;
  };
  organizationId: string;
};

export type CampaignListResponse = {
  campaigns: Array<{
    id: string;
    platform: string;
    campaignId: string;
    name: string;
    status: string | null;
    spend: number | null;
    clicks: number | null;
    impressions: number | null;
    conversions: number | null;
    conversionValue: number | null;
    extraMetrics?: Record<string, number | null>;
    primaryConversionCount?: number | null;
    primaryConversionLabel?: string | null;
    primaryEfficiencyValue?: number | null;
    primaryEfficiencyLabel?: string | null;
    conversionFallbackUsed?: boolean;
  }>;
  filters?: {
    statuses?: string[];
    platforms?: string[];
  };
  extraColumns?: unknown[];
  primaryConversion?: unknown;
};

export type CampaignDetailResponse = {
  campaign: {
    id: string;
    platform: string;
    campaignId: string;
    name: string;
    status: string | null;
    metrics: Array<{
      key: string;
      label: string;
      value: number | null;
      formatter?: string;
    }>;
    extraMetrics?: Record<string, number | null>;
    primaryConversionCount?: number | null;
    primaryConversionLabel?: string | null;
    primaryEfficiencyValue?: number | null;
    primaryEfficiencyLabel?: string | null;
    conversionFallbackUsed?: boolean;
  };
  extraColumns?: unknown[];
  primaryConversion?: unknown;
};

export type AdsListResponse = {
  ads: Array<{
    id: string;
    name: string;
    platform: "facebook";
    campaignId: string;
    status: string | null;
    spend: number;
    impressions: number;
    clicks: number;
    ctr: number | null;
    cpc: number | null;
    avgFrequency: number | null;
    fatigueSignal: "high" | "medium" | "low" | null;
    recentSpendTrend: "rising" | "declining" | "stable" | null;
    spendShare: number | null;
  }>;
};

export type AdDetailResponse = {
  ad: Record<string, unknown>;
};

export type CreativeAnalyticsResponse = {
  aggregates: Array<{
    adId: string;
    adName: string;
    spend: number;
    clicks: number;
    impressions: number;
    frequency: number | null;
    ctr: number | null;
    video2secViews: number;
    videoCompleteViews: number;
    hookRate: number | null;
    holdRate: number | null;
  }>;
  dailyByAd: Array<{
    date: string;
    adId: string;
    adName: string;
    spend: number;
    impressions: number;
  }>;
};

export type CreativeFatigueResponse = {
  adId: string;
  dailyData: Array<{
    date: string;
    frequency: number | null;
    ctr: number | null;
    impressions: number;
  }>;
};

export type ActionsListResponse = {
  actions: Array<{
    id: string;
    title: string;
    status: string;
    verdict: string | null;
    ice_score: number | null;
    lever?: {
      platform?: string;
      campaign_id?: string;
      campaign_name?: string;
    } | null;
    owner_name: string | null;
    owner_name_override: string | null;
    source_label: string | null;
    source_type: string;
    updated_at: string;
    is_stale?: boolean;
    [key: string]: unknown;
  }>;
};

export type ActionResponse = {
  action: Record<string, unknown>;
};

export type AgentsListResponse = {
  agents: Array<{
    id: string;
    name: string;
    description: string | null;
    is_system: boolean;
    trigger: string;
    definition: {
      context?: unknown[];
      outputConfig?: {
        type?: string;
      };
    };
    updated_at: string;
    [key: string]: unknown;
  }>;
};

export type AgentResponse = {
  agent: Record<string, unknown>;
};

export type CampaignAnalysisToolResponse = {
  analysis: {
    summary: string;
    generatedAt: string;
    campaign: {
      id: string;
      name: string;
      status: string | null;
      platform: string;
      spend: number | null;
      conversions: number | null;
      roas: number | null;
      ctr: number | null;
      cpc: number | null;
    };
    findings: Array<{
      id: string;
      title: string;
      severity: "high" | "medium" | "low";
      metric: string;
      evidence: string;
      recommendation: string;
      confidence: number;
    }>;
  };
};
