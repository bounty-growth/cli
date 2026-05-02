import { Command } from "commander";

import {
  formatConfig,
  getEffectiveConfig,
  normalizeApiUrl,
  updateConfig,
} from "../lib/config";
import { writeJson, writeKeyValues, writeLine } from "../lib/output";

type ConfigCommandOptions = {
  json?: boolean;
};

export function registerConfigCommand(program: Command) {
  const config = program
    .command("config")
    .description("Manage Bounty CLI config");

  config
    .command("get")
    .description("Show the active Bounty CLI config")
    .option("--json", "Print JSON output")
    .action(async (options: ConfigCommandOptions) => {
      const activeConfig = formatConfig(await getEffectiveConfig());

      if (options.json) {
        writeJson(activeConfig);
        return;
      }

      writeKeyValues(activeConfig);
    });

  config
    .command("set")
    .description("Set a config value")
    .argument("<key>", "Config key")
    .argument("<value>", "Config value")
    .action(async (key: string, value: string) => {
      if (key !== "api-url") {
        throw new Error(`Unsupported config key: ${key}`);
      }

      await updateConfig((current) => ({
        ...current,
        apiUrl: normalizeApiUrl(value),
      }));

      writeLine("Updated api-url");
    });
}
