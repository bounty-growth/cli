---
name: bounty-cli
description: |
  Use Bounty's authenticated marketing operations CLI for campaign, ad,
  creative, action, and agent workflows. Trigger when the user asks an AI agent
  to inspect Bounty marketing data, review paid performance, find creative
  fatigue, inspect generated actions, or run a Bounty CLI workflow.
allowed-tools:
  - Bash(bounty-cli *)
---

# Bounty CLI

Use `bounty-cli` for authenticated marketing operations. The CLI talks to Bounty
API routes with the logged-in user's permissions; it does not require direct
database, warehouse, Supabase service-role, or ClickHouse access.

## First Checks

```bash
bounty-cli whoami
bounty-cli config get
```

If the user is not logged in:

```bash
bounty-cli login
```

## Workflow

1. Use list commands to discover ids and current state.
2. Use show/analyze commands for detail.
3. Prefer `--json` for analysis, automation, or when another tool will parse the output.
4. Use explicit `--start-date` and `--end-date` values for performance questions.

## Command Map

- Campaigns: `bounty-cli campaigns list`, `bounty-cli campaigns show <campaignId>`
- Ads: `bounty-cli ads list`, `bounty-cli ads show <adId> --platform facebook`
- Creatives: `bounty-cli creatives analytics`, `bounty-cli creatives fatigue <adId>`
- Actions: `bounty-cli actions list`, `bounty-cli actions show <actionId>`
- Agents: `bounty-cli agents list`, `bounty-cli agents show <agentId>`
- Campaign findings: `bounty-cli campaign analyze <campaignId>`

## Related Skills

- `bounty-campaigns` for campaign list/detail workflows
- `bounty-ads` for ad-level inspection
- `bounty-creatives` for creative analytics and fatigue
- `bounty-actions` for generated action review
- `bounty-agents` for agent definitions and context
- `bounty-campaign-analysis` for prioritized findings on one campaign
