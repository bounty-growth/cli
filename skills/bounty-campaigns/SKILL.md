---
name: bounty-campaigns
description: |
  Inspect Bounty campaign performance through the CLI. Use when the user asks
  for campaign lists, campaign spend, conversion performance, campaign status,
  platform filtering, or a specific campaign's details.
allowed-tools:
  - Bash(bounty-cli *)
  - Bash(npx bounty-cli *)
---

# Bounty Campaigns

Use campaign commands when the task is about paid campaign performance or
campaign metadata.

## Commands

```bash
bounty-cli campaigns list --start-date YYYY-MM-DD --end-date YYYY-MM-DD --json
bounty-cli campaigns list --status active --platform facebook --json
bounty-cli campaigns show <campaignId> --start-date YYYY-MM-DD --end-date YYYY-MM-DD --json
```

## Guidance

- Use `campaigns list` first when you need ids, statuses, platforms, or a quick performance scan.
- Use `campaigns show` once you have the exact campaign id.
- Include date ranges for performance comparisons.
- Watch for `primaryConversionLabel`, `primaryEfficiencyValue`, and `conversionFallbackUsed` in JSON output when explaining efficiency.
