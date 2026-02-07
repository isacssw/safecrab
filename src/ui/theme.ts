/**
 * Terminal UI theme - colors, icons, spacing
 */

import chalk from "chalk";
import figures from "figures";

export const colors = {
  critical: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  success: chalk.green,
  dim: chalk.dim,
  bold: chalk.bold,
  crab: chalk.hex("#FF6B35"), // Orange crab color
};

export const icons = {
  cross: figures.cross,
  warning: figures.warning,
  tick: figures.tick,
  info: figures.info,
  pointer: figures.pointer,
  crab: "🦀",
};

export const spacing = {
  section: "\n",
  line: "\n",
  indent: "  ",
  doubleIndent: "    ",
};

/**
 * Format a section header
 */
export function header(text: string): string {
  return colors.bold(text);
}

/**
 * Format a dimmed/secondary text
 */
export function dim(text: string): string {
  return colors.dim(text);
}

/**
 * Format a bullet point
 */
export function bullet(text: string): string {
  return `${spacing.indent}${icons.pointer} ${text}`;
}
