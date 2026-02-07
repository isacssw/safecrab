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
  .action(async () => {
    await scanCommand();
  });

// If no command specified, default to scan
if (process.argv.length === 2) {
  process.argv.push("scan");
}

program.parse();
