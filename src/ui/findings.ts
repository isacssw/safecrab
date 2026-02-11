/**
 * Findings rendering - grouped by severity
 */

import type { Finding } from "../engine/types.js";
import { colors, icons, spacing } from "./theme.js";

export function renderFindings(findings: Finding[]): string {
  if (findings.length === 0) {
    return `${spacing.section}${colors.success(`${icons.tick} No security issues detected.`)}`;
  }

  const lines: string[] = [];

  // Group by severity
  const critical = findings.filter((f) => f.severity === "critical");
  const warnings = findings.filter((f) => f.severity === "warning");
  const info = findings.filter((f) => f.severity === "info");

  // Render critical findings
  if (critical.length > 0) {
    lines.push(spacing.section);
    lines.push(colors.critical.bold("CRITICAL"));
    for (const finding of critical) {
      lines.push(renderFinding(finding));
    }
  }

  // Render warnings
  if (warnings.length > 0) {
    lines.push(spacing.section);
    lines.push(colors.warning.bold("WARNINGS"));
    for (const finding of warnings) {
      lines.push(renderFinding(finding));
    }
  }

  // Render info
  if (info.length > 0) {
    lines.push(spacing.section);
    lines.push(colors.info.bold("INFO"));
    for (const finding of info) {
      lines.push(renderFinding(finding));
    }
  }

  return lines.join(spacing.line);
}

function renderFinding(finding: Finding): string {
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

  // Why flagged (if present)
  if (finding.whyFlagged) {
    lines.push("");
    lines.push(colors.dim(`${spacing.indent}Why flagged:`));
    lines.push(`${spacing.doubleIndent}${finding.whyFlagged}`);
  }

  // Confidence (if present)
  if (finding.confidence) {
    lines.push(colors.dim(`${spacing.indent}Confidence: ${finding.confidence}`));
  }

  // Context notes (if present)
  if (finding.contextNotes) {
    lines.push(colors.dim(`${spacing.indent}Context: ${finding.contextNotes}`));
  }

  // Recommendation if present
  if (finding.recommendation) {
    lines.push("");
    lines.push(colors.dim(`${spacing.indent}Recommendation:`));
    lines.push(`${spacing.doubleIndent}${finding.recommendation}`);
  }

  return lines.join(spacing.line);
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
