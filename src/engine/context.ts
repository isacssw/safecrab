/**
 * Build NetworkContext from system collectors
 */

import { collectCloudflareStatus } from "../system/collectors/cloudflare.js";
import { collectFirewallStatus } from "../system/collectors/firewall.js";
import { collectNetworkInterfaces } from "../system/collectors/network.js";
import { collectTailscaleStatus } from "../system/collectors/tailscale.js";
import type { NetworkContext } from "./types.js";

export async function buildNetworkContext(): Promise<NetworkContext> {
  // Run all collectors in parallel
  const [interfaces, firewall, tailscale, cloudflare] = await Promise.all([
    collectNetworkInterfaces(),
    collectFirewallStatus(),
    collectTailscaleStatus(),
    collectCloudflareStatus(),
  ]);

  return {
    firewall: {
      enabled: firewall.enabled,
      defaultInbound: firewall.defaultInbound,
    },
    tailscale: {
      installed: tailscale.installed,
      connected: tailscale.connected,
      interface: tailscale.interface,
    },
    cloudflare: {
      tunnelDetected: cloudflare.tunnelDetected,
    },
    interfaces,
  };
}
