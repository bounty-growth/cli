---
name: bounty-creatives
description: |
  Inspect Bounty creative analytics through the CLI. Use when the user asks
  about creative fatigue, hook rate, hold rate, frequency, video completion, or
  daily creative performance.
allowed-tools:
  - Bash(bounty-cli *)
---

# Bounty Creatives

Use creative commands for creative-level performance and fatigue diagnosis.

## Commands

```bash
bounty-cli creatives analytics --start-date YYYY-MM-DD --end-date YYYY-MM-DD --json
bounty-cli creatives fatigue <adId> --start-date YYYY-MM-DD --end-date YYYY-MM-DD --json
```

## Guidance

- Use `creatives analytics` for broad creative comparisons.
- Use `creatives fatigue <adId>` when the user points to one ad or asks whether performance is wearing out.
- Look at hook rate, hold rate, frequency, CTR, impressions, and spend together; avoid declaring fatigue from one metric alone.
- Pair with `bounty-ads` if you need ad status, spend share, or campaign context.
