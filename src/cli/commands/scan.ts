/**
 * Scan command - orchestrates the security scan
 */

import ora from "ora";
import { buildNetworkContext } from "../../engine/context.js";
import { resolveAllExposures } from "../../engine/exposure.js";
import { analyzeExposures } from "../../engine/heuristics.js";
import { collectListeningServices } from "../../system/collectors/services.js";
import { buildJsonReport, getExitCode, renderReport } from "../../ui/renderer.js";

export interface ScanCommandOptions {
  verbose: boolean;
  quiet: boolean;
  json: boolean;
}

export async function scanCommand(options: ScanCommandOptions): Promise<void> {
  const { verbose, quiet, json } = options;
  const shouldUseSpinner = !json && !quiet;

  let spinner = ora("Detecting services...");
  if (shouldUseSpinner) {
    spinner = spinner.start();
  }

  try {
    // Step 1: Collect listening services
    const services = await collectListeningServices();
    if (shouldUseSpinner) {
      spinner.succeed(`Found ${services.length} listening services`);
    }

    // Step 2: Build network context
    spinner = ora("Analyzing network context...");
    if (shouldUseSpinner) {
      spinner = spinner.start();
    }
    const context = await buildNetworkContext();
    if (shouldUseSpinner) {
      spinner.succeed("Network context analyzed");
    }

    // Step 3: Resolve exposure paths
    spinner = ora("Evaluating exposure paths...");
    if (shouldUseSpinner) {
      spinner = spinner.start();
    }
    const exposures = resolveAllExposures(services, context);
    if (shouldUseSpinner) {
      spinner.succeed("Exposure analysis complete");
    }

    // Step 4: Run risk heuristics
    spinner = ora("Running security checks...");
    if (shouldUseSpinner) {
      spinner = spinner.start();
    }
    const findings = analyzeExposures(exposures, context);
    if (shouldUseSpinner) {
      spinner.succeed("Security analysis complete");
    }

    spinner.stop();

    // Step 6: Exit with appropriate code
    const exitCode = getExitCode(findings);
    if (json) {
      const report = buildJsonReport({ services, findings }, { verbose, quiet });
      console.log(JSON.stringify(report, null, 2));
      process.exit(exitCode);
    }

    // Step 5: Render report
    const report = renderReport({ services, findings }, { verbose, quiet });
    console.log(`\n${report}\n`);
    process.exit(exitCode);
  } catch (error) {
    if (shouldUseSpinner) {
      spinner.fail("Scan failed");
    }

    if (error instanceof Error) {
      if (json) {
        console.error(
          JSON.stringify(
            {
              error: error.message,
            },
            null,
            2
          )
        );
      } else {
        console.error(`\nError: ${error.message}`);
      }
    } else {
      if (json) {
        console.error(
          JSON.stringify(
            {
              error: "An unknown error occurred",
            },
            null,
            2
          )
        );
      } else {
        console.error("\nAn unknown error occurred");
      }
    }

    process.exit(1);
  }
}
