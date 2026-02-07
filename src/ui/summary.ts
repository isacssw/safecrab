/**
 * Summary section rendering
 */

import type { Finding, ListeningService } from "../engine/types.js";
import { bullet, colors, header, icons, spacing } from "./theme.js";

export interface SummaryStats {
  totalServices: number;
  publiclyReachable: number;
  criticalFindings: number;
  warningFindings: number;
  isRoot: boolean;
}

export function renderSummary(stats: SummaryStats): string {
  const lines: string[] = [];

  // Title
  lines.push(`${icons.crab} ${colors.crab.bold("Safecrab Security Scan")}`);
  lines.push("");

  // Root warning if not running as root
  if (!stats.isRoot) {
    lines.push(
      colors.warning(
        `${icons.warning} Running without root may hide some services and can show incorrect firewall or process info.`
      )
    );
    lines.push(colors.dim("   For full visibility, run Safecrab with sudo."));
    lines.push("");
  }

  // Summary statistics
  lines.push(header("Summary:"));
  lines.push(bullet(`${stats.totalServices} services detected`));
  lines.push(bullet(`${stats.publiclyReachable} publicly reachable`));
  lines.push(bullet(`${stats.criticalFindings} critical issues`));

  if (stats.warningFindings > 0) {
    lines.push(bullet(`${stats.warningFindings} warnings`));
  }

  return lines.join(spacing.line);
}

/**
 * Calculate summary statistics from services and findings
 */
export function calculateStats(
  services: ListeningService[],
  findings: Finding[],
  isRoot: boolean
): SummaryStats {
  const publiclyReachable = new Set(
    findings.filter((f) => f.service && f.severity !== "info").map((f) => f.service?.port)
  ).size;

  return {
    totalServices: services.length,
    publiclyReachable,
    criticalFindings: findings.filter((f) => f.severity === "critical").length,
    warningFindings: findings.filter((f) => f.severity === "warning").length,
    isRoot,
  };
}
