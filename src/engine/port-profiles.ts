/**
 * Port-specific guidance profiles
 * Provides tailored recommendations for common ports
 */

import type { ListeningService } from "./types.js";

export interface PortProfile {
  port: number;
  intent: string;
  recommendation: string;
  matchProcess?: string[]; // Optional: only apply if process matches
}

/**
 * Port profiles for common services
 */
const PORT_PROFILES: PortProfile[] = [
  {
    port: 22,
    intent: "SSH remote access",
    recommendation:
      "Use key-based authentication only (disable password auth). Disable root login. Consider allowlisting source IPs or using Tailscale for private access instead of public exposure.",
  },
  {
    port: 5353,
    intent: "local network discovery (mDNS/Bonjour)",
    recommendation:
      "This port is typically for LAN-local discovery and should not be exposed to the internet. Bind to localhost or LAN interface only. Block WAN access at router/firewall.",
  },
  {
    port: 41641,
    intent: "Tailscale WireGuard transport",
    recommendation:
      "This is expected when Tailscale is actively used. Public exposure is normal for Tailscale's encrypted VPN traffic. No action needed if Tailscale is intentional.",
    matchProcess: ["tailscaled"],
  },
];

/**
 * Get port profile for a service
 * Returns profile if found and process matches (if specified)
 */
export function getPortProfile(service: ListeningService): PortProfile | null {
  const profile = PORT_PROFILES.find((p) => p.port === service.port);

  if (!profile) {
    return null;
  }

  // If profile has process requirement, check if it matches
  if (profile.matchProcess && profile.matchProcess.length > 0) {
    const processMatches = profile.matchProcess.some((processName) =>
      service.process.toLowerCase().includes(processName.toLowerCase())
    );

    if (!processMatches) {
      return null;
    }
  }

  return profile;
}

/**
 * Get enhanced recommendation for a service
 * Combines default recommendation with port-specific guidance
 */
export function getEnhancedRecommendation(
  service: ListeningService,
  defaultRecommendation: string
): string {
  const profile = getPortProfile(service);

  if (!profile) {
    return defaultRecommendation;
  }

  return profile.recommendation;
}

/**
 * Get port intent label
 */
export function getPortIntent(service: ListeningService): string | null {
  const profile = getPortProfile(service);
  return profile?.intent ?? null;
}
