import { Command } from "commander";

import { getAuthenticatedApiClient, signInWithBrowser } from "../lib/auth";
import type { CliWhoamiResponse } from "../lib/api-contracts";
import { getEffectiveConfig } from "../lib/config";
import { clearSession } from "../lib/session";
import { writeKeyValues, writeLine, writeOutput } from "../lib/output";

type JsonOptions = {
  json?: boolean;
};

export function registerAuthCommands(program: Command) {
  program
    .command("login")
    .description("Log in to Bounty")
    .action(async () => {
      const config = await getEffectiveConfig();

      const session = await signInWithBrowser({
        config,
        onAuthorizeUrl: (url) => {
          writeLine("Opening Bounty in your browser to finish login.");
          writeLine(`If it does not open, visit: ${url}`);
        },
      });

      writeLine("Logged in to Bounty");
      writeLine(
        `Session expires at ${new Date(session.expiresAt * 1000).toISOString()}`
      );
    });

  program
    .command("logout")
    .description("Clear the stored Bounty CLI session")
    .action(async () => {
      await clearSession();
      writeLine("Logged out");
    });

  program
    .command("whoami")
    .description("Show the authenticated Bounty user and organization")
    .option("--json", "Print JSON output")
    .action(async (options: JsonOptions) => {
      const { client } = await getAuthenticatedApiClient();
      const identity =
        await client.request<CliWhoamiResponse>("/api/cli/whoami");

      writeOutput(identity, options, () => {
        writeKeyValues({
          user: identity.user.email ?? identity.user.id,
          organization: identity.organization?.name ?? identity.organizationId,
          organizationId: identity.organizationId,
        });
      });
    });
}
