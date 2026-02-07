/**
 * Collector for Tailscale detection
 */

import { commandExists, execCommand } from "../shell.js";

export interface TailscaleStatus {
  installed: boolean;
  connected: boolean;
  interface?: string;
}

export async function collectTailscaleStatus(): Promise<TailscaleStatus> {
  try {
    // Check if tailscale command exists
    const installed = await commandExists("tailscale");

    if (!installed) {
      return {
        installed: false,
        connected: false,
      };
    }

    // Check connection status
    const statusResult = await execCommand("tailscale", ["status"], {
      ignoreErrors: true,
    });

    // Connected if command succeeds and has output
    const connected = statusResult.success && statusResult.stdout.length > 0;

    // Check for tailscale0 interface
    const ipResult = await execCommand("ip", ["addr", "show", "tailscale0"], {
      ignoreErrors: true,
    });

    const hasInterface = ipResult.success;

    return {
      installed: true,
      connected,
      interface: hasInterface ? "tailscale0" : undefined,
    };
  } catch (error) {
    return {
      installed: false,
      connected: false,
    };
  }
}
