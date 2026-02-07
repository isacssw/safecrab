/**
 * Main report renderer
 */

import type { Finding, ListeningService } from "../engine/types.js";
import { isRoot } from "../system/shell.js";
import { renderFindings } from "./findings.js";
import { calculateStats, renderSummary } from "./summary.js";
import { dim, spacing } from "./theme.js";

export interface ScanReport {
  services: ListeningService[];
  findings: Finding[];
}

/**
 * Render the complete security scan report
 */
export function renderReport(report: ScanReport): string {
  const { services, findings } = report;
  const root = isRoot();

  const lines: string[] = [];

  // Summary section
  const stats = calculateStats(services, findings, root);
  lines.push(renderSummary(stats));

  // Findings sections
  lines.push(renderFindings(findings));

  // Footer - trust-building message
  lines.push(spacing.section);
  lines.push(dim("No changes were made to your system."));

  return lines.join(spacing.line);
}

/**
 * Determine exit code based on findings
 * Returns 1 if critical findings exist, 0 otherwise
 */
export function getExitCode(findings: Finding[]): number {
  const hasCritical = findings.some((f) => f.severity === "critical");
  return hasCritical ? 1 : 0;
}
