# Bounty CLI

Authenticated Bounty commands for marketers, LLMs, and local agents.

The CLI talks to Bounty API routes using a normal Supabase user session. It does not read Supabase tables, ClickHouse, CSV files, warehouse credentials, or service-role keys directly.

## Quick Start

For AI coding agents, install the CLI skills and authenticate in one step:

```bash
npx -y bounty-cli@latest init --all --browser
```

- `--all` installs Bounty marketing skills to every detected AI coding agent
- `--browser` opens Bounty browser login for CLI authentication

After installing skills, restart your AI agent so it can discover them.

Run without installing globally:

```bash
npx -y bounty-cli@latest login
npx -y bounty-cli@latest whoami
npx -y bounty-cli@latest campaigns list --json
```

Or install globally:

```bash
npm install -g bounty-cli
bounty-cli login
bounty-cli whoami
```

The package name and installed binary are both `bounty-cli`.

`npx` requires Node/npm on the machine. The package itself is bundled into a single CLI file with no npm runtime dependencies, but true no-Node distribution would need a separate native binary release, such as Homebrew or GitHub Release binaries.

## Agent Skills

Bounty publishes customer-safe marketing skills for AI coding agents. They teach
agents how to use the CLI for common marketing workflows without direct database
or warehouse access.

Public onboarding document:

```bash
curl -s https://app.bountygrowth.com/agent-onboarding/SKILL.md
```

Manual skill install:

```bash
bounty-cli setup skills
```

The CLI installs skills from:

```bash
npx -y skills add bounty-growth/cli --full-depth --global --all --yes
```

The source for those skills lives in this repository under `skills/` and is
included in the published npm package.

Available skills:

- `bounty-cli` - overall authenticated CLI workflow
- `bounty-campaigns` - campaign lists, filters, and details
- `bounty-ads` - ad-level performance and ad details
- `bounty-creatives` - creative analytics and fatigue checks
- `bounty-actions` - generated marketing actions and status review
- `bounty-agents` - configured agent definitions and context
- `bounty-campaign-analysis` - prioritized findings for one campaign

## Defaults

Installed usage should be one-touch. Customers do not need a `.env` file.

Default production target:

- API: `https://app.bountygrowth.com`
- Supabase URL and anon key: compiled public defaults in `src/lib/defaults.ts`

The Supabase anon key is safe to ship in the CLI. It is a public browser/client key, not a service-role key. Authorization still depends on the logged-in user session and server-side route checks.

## Authentication

Default login is browser-based:

```bash
bounty-cli login
```

Flow:

1. The CLI starts a temporary callback server on `127.0.0.1:<random>/callback`.
2. The CLI generates `state`, `codeVerifier`, and `codeChallenge`.
3. The browser opens `/cli/authorize` on the configured Bounty app.
4. If the user is not signed in, the app redirects through normal Bounty login.
5. The user explicitly approves CLI access.
6. The browser receives only a one-time code and state, not raw refresh tokens.
7. The CLI exchanges `{ code, codeVerifier }` with `/api/cli/token`.
8. The CLI stores the returned Supabase session locally.

Stored session fields:

- access token
- refresh token
- expiry
- user id
- API URL

The CLI never stores or logs service-role keys.

Terminal email/password login is still available for development or fallback:

```bash
bounty-cli login --email user@example.com
```

Clear local credentials:

```bash
bounty-cli logout
```

## Configuration

View config:

```bash
bounty-cli config get
bounty-cli config get --json
```

Override API URL:

```bash
bounty-cli config set api-url https://app.bountygrowth.com
```

Environment override:

```bash
BOUNTY_API_URL=http://localhost:3000 bounty-cli whoami
```

Allowed API URLs:

- `https://...` for remote backends
- `http://localhost...` or `http://127.0.0.1...` for local development

Non-local `http://` URLs are rejected because bearer tokens would be sent in plaintext.

The packaged CLI does not auto-load `.env` files from the current working directory. Repo-local env loading is handled only by the repo wrapper script, `scripts/bounty.mjs`.

## Commands

Auth:

```bash
bounty-cli login
bounty-cli login --email <email>
bounty-cli logout
bounty-cli whoami [--json]
```

Config:

```bash
bounty-cli config get [--json]
bounty-cli config set api-url <url>
```

Setup:

```bash
bounty-cli init [--all] [--browser] [--agent <agent>] [--skip-auth] [--skip-skills]
bounty-cli setup skills [--agent <agent>]
```

Campaigns:

```bash
bounty-cli campaigns list [--start-date <date>] [--end-date <date>] [--json]
bounty-cli campaigns show <campaignId> [--start-date <date>] [--end-date <date>] [--json]
bounty-cli campaign analyze <campaignId> --start-date <date> --end-date <date> [--wait] [--json]
```

Ads and creatives:

```bash
bounty-cli ads list --start-date <date> --end-date <date> [--status <status>] [--sort-by spend|impressions|clicks|ctr|cpc] [--json]
bounty-cli ads show <adId> --platform facebook [--start-date <date>] [--end-date <date>] [--json]
bounty-cli creatives analytics --start-date <date> --end-date <date> [--json]
bounty-cli creatives fatigue <adId> --start-date <date> --end-date <date> [--json]
```

Actions and agents:

```bash
bounty-cli actions list [--status <status>] [--verdict <verdict>] [--full] [--json]
bounty-cli actions show <actionId> [--json]
bounty-cli agents list [--full] [--json]
bounty-cli agents show <agentId> [--json]
```

List commands return concise JSON by default for LLM/agent use. Use `--full` or a `show` command when raw objects are needed.

## Local Development

From the repo:

```bash
yarn install
yarn bounty --help
```

To test against a local Bounty web app, start the app from the main Bounty
application repo. For example, with production Supabase:

```bash
yarn dev:production
```

Then in another terminal:

```bash
BOUNTY_API_URL=http://localhost:3000 yarn bounty login
BOUNTY_API_URL=http://localhost:3000 yarn bounty whoami
BOUNTY_API_URL=http://localhost:3000 yarn bounty campaigns list --json
```

Local app with local Supabase:

```bash
yarn dev
BOUNTY_API_URL=http://localhost:3000 yarn bounty login
```

Test the built package locally:

```bash
yarn build
node dist/index.cjs --help
node dist/index.cjs whoami
```

## Publishing

After merging to `main`, publish from a clean, up-to-date main checkout:

```bash
git checkout main
git pull
yarn install
yarn type-check
yarn test
yarn build
```

Check package contents:

```bash
npm pack --dry-run
```

Log in and publish:

```bash
npm login
npm whoami
npm publish
```

The npm user must have publish access to the `bounty-cli` package name.

Smoke test after publishing:

```bash
npx -y bounty-cli@latest --help
npx -y bounty-cli@latest login
npx -y bounty-cli@latest whoami
```

For the next release, bump the CLI version first:

```bash
npm version patch --no-git-tag-version
```

Commit the version bump, merge, then publish.

## Build Isolation

The CLI is intentionally standalone from the Bounty web app:

- `yarn type-check` checks the CLI package.
- `yarn test` runs CLI tests.
- `yarn build` bundles the CLI and runs `scripts/check-bounty-cli-bundle.mjs`.

The CLI bundle must not include Next.js app modules, route handlers, React, or server-only app helpers.

Guards:

- `tsup.config.ts` blocks runtime imports through the app alias and Next/React packages.
- `scripts/check-bounty-cli-bundle.mjs` scans `dist/index.cjs` for forbidden app/runtime fragments.
- CLI API response contracts live in `src/lib/api-contracts.ts` rather than importing Next route types.

## Security Notes

- CLI requests authenticate with `Authorization: Bearer <access_token>`.
- API routes fall back to browser cookie auth where existing web behavior needs it.
- Browser login uses explicit approval plus a one-time authorization code.
- `cli_auth_codes` stores only code metadata, not Supabase refresh tokens.
- Expired or abandoned CLI auth codes do not leave refresh tokens in Postgres.
- The CLI rejects non-local plaintext HTTP API URLs.
- The packaged CLI does not load arbitrary current-directory `.env` files.
- The CLI never queries Supabase tables or ClickHouse directly.

## Future Native Distribution

The npm package is the first release path and works well for `npx` and AI agents.

For users who do not have Node/npm, ship a native binary later via:

- GitHub Releases
- Homebrew tap
- optional install script, for example `curl -fsSL https://cli.bountygrowth.com/install.sh | sh`
