/**
 * Collector for firewall status (UFW)
 */

import { commandExists, execCommand } from "../shell.js";

export interface FirewallStatus {
  enabled: boolean;
  defaultInbound: "allow" | "deny" | "unknown";
  statusKnown: boolean;
}

export async function collectFirewallStatus(): Promise<FirewallStatus> {
  try {
    // Check if UFW is installed
    const ufwExists = await commandExists("ufw");
    if (!ufwExists) {
      // No firewall detected - assume allow all
      return {
        enabled: false,
        defaultInbound: "allow",
        statusKnown: true,
      };
    }

    // Get UFW status
    const result = await execCommand("ufw", ["status", "verbose"], {
      ignoreErrors: true,
    });

    if (!result.success) {
      // UFW command failed (likely permission denied without sudo)
      return {
        enabled: false,
        defaultInbound: "unknown",
        statusKnown: false,
      };
    }

    const output = result.stdout.toLowerCase();

    // Check if active
    const isActive = output.includes("status: active") || output.includes("status:active");

    // Parse default policy
    let defaultInbound: "allow" | "deny" | "unknown" = "unknown";

    if (output.includes("default: deny (incoming)")) {
      defaultInbound = "deny";
    } else if (output.includes("default: allow (incoming)")) {
      defaultInbound = "allow";
    } else if (output.includes("default:deny(incoming)")) {
      defaultInbound = "deny";
    } else if (output.includes("default:allow(incoming)")) {
      defaultInbound = "allow";
    } else if (isActive) {
      // UFW is active but can't parse policy - conservative assumption
      defaultInbound = "deny";
    } else {
      // UFW inactive - traffic flows freely
      defaultInbound = "allow";
    }

    return {
      enabled: isActive,
      defaultInbound,
      statusKnown: true,
    };
  } catch (error) {
    // Best-effort: could not determine status
    return {
      enabled: false,
      defaultInbound: "allow",
      statusKnown: false,
    };
  }
}
