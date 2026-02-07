/**
 * Scan command - orchestrates the security scan
 */

import ora from "ora";
import { buildNetworkContext } from "../../engine/context.js";
import { resolveAllExposures } from "../../engine/exposure.js";
import { analyzeExposures } from "../../engine/heuristics.js";
import { collectListeningServices } from "../../system/collectors/services.js";
import { getExitCode, renderReport } from "../../ui/renderer.js";

export async function scanCommand(): Promise<void> {
  let spinner = ora("Detecting services...").start();

  try {
    // Step 1: Collect listening services
    const services = await collectListeningServices();
    spinner.succeed(`Found ${services.length} listening services`);

    // Step 2: Build network context
    spinner = ora("Analyzing network context...").start();
    const context = await buildNetworkContext();
    spinner.succeed("Network context analyzed");

    // Step 3: Resolve exposure paths
    spinner = ora("Evaluating exposure paths...").start();
    const exposures = resolveAllExposures(services, context);
    spinner.succeed("Exposure analysis complete");

    // Step 4: Run risk heuristics
    spinner = ora("Running security checks...").start();
    const findings = analyzeExposures(exposures, context);
    spinner.succeed("Security analysis complete");

    spinner.stop();

    // Step 5: Render report
    const report = renderReport({ services, findings });
    console.log(`\n${report}\n`);

    // Step 6: Exit with appropriate code
    const exitCode = getExitCode(findings);
    process.exit(exitCode);
  } catch (error) {
    spinner.fail("Scan failed");

    if (error instanceof Error) {
      console.error(`\nError: ${error.message}`);
    } else {
      console.error("\nAn unknown error occurred");
    }

    process.exit(1);
  }
}
