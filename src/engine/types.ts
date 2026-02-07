/**
 * Core data models for Safecrab security scanner
 */

export interface ListeningService {
  port: number;
  protocol: "tcp" | "udp";
  process: string;
  pid: number;
  interfaces: string[]; // e.g. ["eth0", "lo", "tailscale0"]
  boundIp: string; // The IP address the service is bound to
}

export interface NetworkContext {
  firewall: {
    enabled: boolean;
    defaultInbound: "allow" | "deny" | "unknown";
    statusKnown: boolean;
  };
  tailscale: {
    installed: boolean;
    connected: boolean;
    interface?: string;
  };
  cloudflare: {
    tunnelDetected: boolean;
  };
  interfaces: {
    name: string;
    ips: string[];
    isPublic: boolean;
  }[];
}

export type ExposurePath = "public-internet" | "tailscale" | "cloudflare-tunnel" | "localhost-only";

export interface ServiceExposure {
  service: ListeningService;
  paths: ExposurePath[];
}

export type FindingSeverity = "info" | "warning" | "critical";

export interface Finding {
  severity: FindingSeverity;
  title: string;
  description: string;
  recommendation?: string;
  service?: ListeningService;
  icon?: "tick" | "warning";
}
