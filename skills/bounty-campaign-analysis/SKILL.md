---
name: bounty-campaign-analysis
description: |
  Run Bounty's campaign analysis tool from the CLI. Use when the user wants
  prioritized findings, evidence, or recommendations for one campaign.
allowed-tools:
  - Bash(bounty-cli *)
---

# Bounty Campaign Analysis

Use this skill when one campaign needs a focused diagnosis and prioritized
findings.

## Command

```bash
bounty-cli campaign analyze <campaignId> --start-date YYYY-MM-DD --end-date YYYY-MM-DD --json
```

## Guidance

- Find the campaign id with `bounty-cli campaigns list --json` if needed.
- Include a date range unless the user explicitly wants the backend default.
- Use JSON output when you need to cite findings, evidence, recommendations, or confidence.
- If the tool returns no findings, summarize that directly and suggest the next useful CLI command only when it would add evidence.
