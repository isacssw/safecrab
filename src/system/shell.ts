/**
 * Centralized shell execution wrapper
 * This is the ONLY place raw shell calls happen
 */

import { execa } from "execa";

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface ShellOptions {
  timeout?: number; // milliseconds, default 5000
  ignoreErrors?: boolean; // continue even if command fails
}

/**
 * Execute a shell command with error handling
 */
export async function execCommand(
  command: string,
  args: string[] = [],
  options: ShellOptions = {}
): Promise<CommandResult> {
  const timeout = options.timeout ?? 5000;
  const ignoreErrors = options.ignoreErrors ?? false;

  try {
    const result = await execa(command, args, {
      timeout,
      reject: false, // Don't throw on non-zero exit codes
      shell: false,
    });

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode ?? 0,
      success: result.exitCode === 0,
    };
  } catch (error) {
    if (ignoreErrors) {
      return {
        stdout: "",
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        success: false,
      };
    }
    throw error;
  }
}

/**
 * Check if running with root privileges
 */
export function isRoot(): boolean {
  try {
    return process.getuid?.() === 0;
  } catch {
    // getuid not available (e.g., on Windows)
    return false;
  }
}

/**
 * Check if a command exists in PATH
 */
export async function commandExists(command: string): Promise<boolean> {
  const result = await execCommand("which", [command], { ignoreErrors: true });
  return result.success;
}
