/**
 * Collector for Cloudflare Tunnel detection
 */

import { constants, access } from "node:fs/promises";
import { execCommand } from "../shell.js";

export interface CloudflareStatus {
  tunnelDetected: boolean;
}

export async function collectCloudflareStatus(): Promise<CloudflareStatus> {
  try {
    // Method 1: Check for cloudflared process
    const psResult = await execCommand("ps", ["aux"], { ignoreErrors: true });

    const hasProcess = psResult.success && psResult.stdout.includes("cloudflared");

    // Method 2: Check for cloudflared config directory
    let hasConfig = false;
    try {
      await access("/etc/cloudflared", constants.F_OK);
      hasConfig = true;
    } catch {
      hasConfig = false;
    }

    // Tunnel is detected if either condition is true
    const tunnelDetected = hasProcess || hasConfig;

    return {
      tunnelDetected,
    };
  } catch (error) {
    return {
      tunnelDetected: false,
    };
  }
}
