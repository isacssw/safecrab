#!/usr/bin/env node

/**
 * Safecrab CLI entry point
 */

import { Command } from "commander";
import { scanCommand } from "./commands/scan.js";

const program = new Command();

program
  .name("safecrab")
  .description("Security scanner for Linux VPS environments - detect accidental service exposure")
  .version("0.1.0");

program
  .command("scan")
  .description("Scan for exposed services and security issues")
  .option("-v, --verbose", "show expanded details for each finding")
  .option("-q, --quiet", "show only actionable findings")
  .option("--json", "emit machine-readable JSON output")
  .action(async (options: { verbose?: boolean; quiet?: boolean; json?: boolean }) => {
    await scanCommand({
      verbose: options.verbose ?? false,
      quiet: options.quiet ?? false,
      json: options.json ?? false,
    });
  });

// If no command specified, default to scan
if (process.argv.length === 2) {
  process.argv.push("scan");
}

program.parse();
