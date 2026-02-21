/**
 * Collector for Cloudflare Tunnel detection
 */

import { constants, access } from "node:fs/promises";
import { execCommand } from "../shell.js";

export interface CloudflareStatus {
  tunnelDetected: boolean;
  detectionConfidence: "high" | "low";
  evidence: string[];
}

export async function collectCloudflareStatus(): Promise<CloudflareStatus> {
  try {
    const evidence: string[] = [];

    // Method 1: Check for cloudflared process with strict matching.
    const psResult = await execCommand("ps", ["-eo", "comm,args"], { ignoreErrors: true });
    const hasProcess =
      psResult.success &&
      psResult.stdout
        .split("\n")
        .some((line) => /^\s*cloudflared(?:\s|$)/.test(line) || /\bcloudflared\b/.test(line));
    if (hasProcess) {
      evidence.push("process");
    }

    // Method 2: Check for cloudflared config directory and known config file.
    let hasConfig = false;
    try {
      await access("/etc/cloudflared", constants.F_OK);
      hasConfig = true;
      evidence.push("config-dir");
    } catch {
      hasConfig = false;
    }

    let hasConfigFile = false;
    try {
      await access("/etc/cloudflared/config.yml", constants.F_OK);
      hasConfigFile = true;
      evidence.push("config-file");
    } catch {
      try {
        await access("/etc/cloudflared/config.yaml", constants.F_OK);
        hasConfigFile = true;
        evidence.push("config-file");
      } catch {
        hasConfigFile = false;
      }
    }

    // Strong signal: running process.
    // Weak signal: complete config footprint even if process not currently active.
    const tunnelDetected = hasProcess || (hasConfig && hasConfigFile);
    const detectionConfidence: "high" | "low" = hasProcess
      ? "high"
      : tunnelDetected
        ? "low"
        : "low";

    return {
      tunnelDetected,
      detectionConfidence,
      evidence,
    };
  } catch (error) {
    return {
      tunnelDetected: false,
      detectionConfidence: "low",
      evidence: [],
    };
  }
}
