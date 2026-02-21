/**
 * Main report renderer
 */

import type { Finding, ListeningService } from "../engine/types.js";
import { isRoot } from "../system/shell.js";
import { renderFindings } from "./findings.js";
import { calculateStats, renderSummary } from "./summary.js";
import { bullet, colors, dim, header, icons, spacing } from "./theme.js";

export interface ScanReport {
  services: ListeningService[];
  findings: Finding[];
}

export interface ReportRenderOptions {
  verbose: boolean;
  quiet: boolean;
}

export interface JsonScanReport {
  mode: "default" | "verbose" | "quiet";
  generatedAt: string;
  exitCode: number;
  stats: ReturnType<typeof calculateStats>;
  services: ListeningService[];
  findings: Finding[];
  topActions: string[];
  environmentNotes: string[];
  outputSanitization: "terminal-only";
}

/**
 * Render the complete security scan report
 */
export function renderReport(report: ScanReport, options: ReportRenderOptions): string {
  const { services, findings } = report;
  const root = isRoot();

  const lines: string[] = [];

  const stats = calculateStats(services, findings, root);
  const topActions = collectTopActions(findings);
  const environmentNotes = buildEnvironmentNotes(root);

  if (!options.quiet) {
    lines.push(renderSummary(stats));
    lines.push(renderTopActions(topActions));
  }

  lines.push(renderFindings(findings, options));

  if (!options.quiet) {
    if (environmentNotes.length > 0) {
      lines.push(renderEnvironmentNotes(environmentNotes));
    }
    lines.push(spacing.section);
    lines.push(dim("No changes were made to your system."));
  }

  return lines.join(spacing.line);
}

export function buildJsonReport(report: ScanReport, options: ReportRenderOptions): JsonScanReport {
  const root = isRoot();
  const stats = calculateStats(report.services, report.findings, root);
  return {
    mode: options.quiet ? "quiet" : options.verbose ? "verbose" : "default",
    generatedAt: new Date().toISOString(),
    exitCode: getExitCode(report.findings),
    stats,
    services: report.services,
    findings: report.findings,
    topActions: collectTopActions(report.findings),
    environmentNotes: buildEnvironmentNotes(root),
    outputSanitization: "terminal-only",
  };
}

/**
 * Determine exit code based on findings
 * Returns 1 if critical findings exist, 0 otherwise
 */
export function getExitCode(findings: Finding[]): number {
  const hasCritical = findings.some((f) => f.severity === "critical");
  return hasCritical ? 1 : 0;
}

function collectTopActions(findings: Finding[]): string[] {
  const prioritized = findings.filter((f) => f.severity !== "info" && f.recommendation);
  const actions: string[] = [];
  const seen = new Set<string>();

  for (const finding of prioritized) {
    const action = normalizeRecommendation(finding.recommendation);
    if (action && !seen.has(action)) {
      seen.add(action);
      actions.push(action);
    }
    if (actions.length === 3) {
      break;
    }
  }

  return actions;
}

function renderTopActions(actions: string[]): string {
  const lines: string[] = [];
  lines.push(spacing.section);
  lines.push(header("Top actions:"));

  if (actions.length === 0) {
    lines.push(bullet("No immediate action required."));
    return lines.join(spacing.line);
  }

  for (const action of actions) {
    lines.push(bullet(action));
  }

  return lines.join(spacing.line);
}

function buildEnvironmentNotes(isRunningAsRoot: boolean): string[] {
  if (isRunningAsRoot) {
    return [];
  }

  return [
    `${icons.warning} Running without root may hide some services and can show incomplete firewall or process info.`,
    "For full visibility, re-run with sudo.",
    "If sudo cannot find the command, install globally: sudo npm install -g safecrab",
  ];
}

function renderEnvironmentNotes(notes: string[]): string {
  if (notes.length === 0) {
    return "";
  }

  const lines: string[] = [];
  lines.push(spacing.section);
  lines.push(colors.warning.bold("Environment notes"));

  for (const note of notes) {
    lines.push(colors.dim(`${spacing.indent}${note}`));
  }

  return lines.join(spacing.line);
}

function normalizeRecommendation(recommendation?: string): string | undefined {
  if (!recommendation) {
    return undefined;
  }

  const normalized = recommendation.replace(/\s+/g, " ").trim();
  const firstSentenceMatch = normalized.match(/^.+?[.!?](?:\s|$)/);
  return firstSentenceMatch ? firstSentenceMatch[0].trim() : normalized;
}
