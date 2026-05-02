---
name: bounty-agents
description: |
  Inspect Bounty agent definitions through the CLI. Use when the user asks about
  configured agents, system agents, triggers, output types, or agent context.
allowed-tools:
  - Bash(bounty-cli *)
  - Bash(npx bounty-cli *)
---

# Bounty Agents

Use agent commands to inspect configured Bounty agents and their definitions.

## Commands

```bash
bounty-cli agents list --json
bounty-cli agents list --full --json
bounty-cli agents show <agentId> --json
```

## Guidance

- Use `agents list --json` for a concise inventory.
- Use `agents list --full --json` when prompt, definition, or context details matter.
- Use `agents show` for one exact agent.
- Do not assume custom agent prompts are under product control unless the user explicitly says they are.
