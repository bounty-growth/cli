---
name: bounty-ads
description: |
  Inspect ad-level performance in Bounty through the CLI. Use when the user asks
  about specific ads, top or weak ads, ad spend, CTR, CPC, frequency, status, or
  fatigue signals.
allowed-tools:
  - Bash(bounty-cli *)
  - Bash(npx bounty-cli *)
---

# Bounty Ads

Use ad commands for ad-level performance and diagnostics.

## Commands

```bash
bounty-cli ads list --start-date YYYY-MM-DD --end-date YYYY-MM-DD --json
bounty-cli ads list --status ACTIVE --sort-by spend --start-date YYYY-MM-DD --end-date YYYY-MM-DD --json
bounty-cli ads show <adId> --platform facebook --start-date YYYY-MM-DD --end-date YYYY-MM-DD --json
```

## Guidance

- Start with `ads list` to identify candidate ad ids.
- Sort by `spend`, `impressions`, `clicks`, `ctr`, or `cpc` when ranking ads.
- Use `ads show` for full raw detail on one ad.
- Pair with `bounty-creatives` when fatigue or hook/hold performance matters.
