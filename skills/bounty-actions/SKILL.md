---
name: bounty-actions
description: |
  Inspect generated Bounty marketing actions through the CLI. Use when the user
  asks for recommended actions, action status, verdicts, owners, ICE scores, or
  details behind a proposed marketing action.
allowed-tools:
  - Bash(bounty-cli *)
  - Bash(npx bounty-cli *)
---

# Bounty Actions

Use action commands to review generated or managed marketing actions.

## Commands

```bash
bounty-cli actions list --json
bounty-cli actions list --status backlog --verdict accepted --json
bounty-cli actions list --include-stale --json
bounty-cli actions show <actionId> --json
```

## Guidance

- Use `actions list --json` for concise machine-readable summaries.
- Add `--full --json` only when raw action objects are necessary.
- Use `actions show` for evidence, notes, or detailed action payloads.
- Pay attention to stale actions before recommending execution.
