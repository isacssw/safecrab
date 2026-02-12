/**
 * Findings rendering - grouped by severity
 */

import type { Finding } from "../engine/types.js";
import { bullet, colors, icons, spacing } from "./theme.js";

export interface FindingsRenderOptions {
  verbose: boolean;
  quiet: boolean;
}

export function renderFindings(findings: Finding[], options: FindingsRenderOptions): string {
  if (findings.length === 0) {
    return options.quiet
      ? colors.success(`${icons.tick} No actionable findings.`)
      : `${spacing.section}${colors.success(`${icons.tick} No security issues detected.`)}`;
  }

  const lines: string[] = [];

  // Group by severity
  const critical = findings.filter((f) => f.severity === "critical");
  const warnings = findings.filter((f) => f.severity === "warning");
  const info = findings.filter((f) => f.severity === "info");

  // Render critical findings
  if (critical.length > 0) {
    if (!options.quiet && lines.length > 0) {
      lines.push(spacing.section);
    }
    lines.push(colors.critical.bold("CRITICAL"));
    for (const finding of critical) {
      lines.push(renderFinding(finding, options));
    }
  }

  // Render warnings
  if (warnings.length > 0) {
    if (lines.length > 0) {
      lines.push(spacing.section);
    }
    lines.push(colors.warning.bold("WARNINGS"));
    for (const finding of warnings) {
      lines.push(renderFinding(finding, options));
    }
  }

  // Render info
  if (info.length > 0 && !options.quiet) {
    if (lines.length > 0) {
      lines.push(spacing.section);
    }
    lines.push(colors.info.bold("INFO"));

    if (!options.verbose) {
      lines.push(colors.dim(`${spacing.indent}${info.length} informational notes hidden.`));
      lines.push(colors.dim(`${spacing.indent}Re-run with --verbose to see full details.`));
      for (const finding of info) {
        lines.push(bullet(`${finding.title}`));
      }
    } else {
      for (const finding of info) {
        lines.push(renderFinding(finding, options));
      }
    }
  }

  return lines.join(spacing.line);
}

function renderFinding(finding: Finding, options: FindingsRenderOptions): string {
  const lines: string[] = [];

  // Icon + title
  const icon = getIcon(finding);
  const colorFn = getColor(finding.severity);
  lines.push(colorFn(`${icon} ${finding.title}`));

  // Description with indentation
  const descLines = finding.description.split("\n");
  for (const line of descLines) {
    lines.push(`${spacing.indent}${line}`);
  }

  const recommendation = splitRecommendation(finding.recommendation);
  if (recommendation.short) {
    lines.push("");
    lines.push(colors.dim(`${spacing.indent}Action:`));
    lines.push(`${spacing.doubleIndent}${recommendation.short}`);
  }

  // Why flagged (verbose only)
  if (finding.whyFlagged && options.verbose) {
    lines.push("");
    lines.push(colors.dim(`${spacing.indent}Why flagged:`));
    lines.push(`${spacing.doubleIndent}${finding.whyFlagged}`);
  }

  // Confidence (verbose only)
  if (finding.confidence && options.verbose) {
    lines.push(colors.dim(`${spacing.indent}Confidence: ${finding.confidence}`));
  }

  // Context notes (verbose only)
  if (finding.contextNotes && options.verbose) {
    lines.push(colors.dim(`${spacing.indent}Context: ${finding.contextNotes}`));
  }

  if (options.verbose && recommendation.detail) {
    lines.push("");
    lines.push(colors.dim(`${spacing.indent}Details:`));
    lines.push(`${spacing.doubleIndent}${recommendation.detail}`);
  }

  return lines.join(spacing.line);
}

function splitRecommendation(recommendation?: string): { short?: string; detail?: string } {
  if (!recommendation) {
    return {};
  }

  const normalized = recommendation.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return {};
  }

  const firstSentenceMatch = normalized.match(/^.+?[.!?](?:\s|$)/);
  if (!firstSentenceMatch) {
    return { short: normalized };
  }

  const short = firstSentenceMatch[0].trim();
  const detail = normalized.slice(short.length).trim();
  return detail ? { short, detail } : { short };
}

function getIcon(finding: Finding): string {
  // Use icon override if specified
  if (finding.icon === "warning") {
    return icons.warning;
  }
  if (finding.icon === "tick") {
    return icons.tick;
  }

  // Default icon based on severity
  switch (finding.severity) {
    case "critical":
      return icons.cross;
    case "warning":
      return icons.warning;
    case "info":
      return icons.tick;
    default:
      return icons.info;
  }
}

function getColor(severity: string): (text: string) => string {
  switch (severity) {
    case "critical":
      return colors.critical;
    case "warning":
      return colors.warning;
    case "info":
      return colors.info;
    default:
      return (text: string) => text;
  }
}
