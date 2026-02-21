/**
 * Parser for ss -tulnp output
 * Extracts listening services with port, protocol, process info
 */

import { z } from "zod";
import type { ListeningService } from "../../engine/types.js";

const ListeningServiceSchema = z.object({
  port: z.number(),
  protocol: z.enum(["tcp", "udp"]),
  process: z.string(),
  pid: z.number(),
  interfaces: z.array(z.string()),
  boundIp: z.string(),
});

/**
 * Parse ss -tulnp output into structured ListeningService objects
 *
 * Example ss output:
 * Netid  State   Recv-Q  Send-Q  Local Address:Port  Peer Address:Port  Process
 * tcp    LISTEN  0       128     0.0.0.0:22          0.0.0.0:*          users:(("sshd",pid=1234,fd=3))
 * udp    UNCONN  0       0       127.0.0.1:53        0.0.0.0:*          users:(("systemd-resolve",pid=567,fd=12))
 */
export function parseSSOutput(
  output: string,
  interfaceMap: Map<string, string[]>
): ListeningService[] {
  const services: ListeningService[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    // Skip header and empty lines
    if (!line.trim() || line.startsWith("Netid") || line.startsWith("State")) {
      continue;
    }

    const service = parseSSLine(line, interfaceMap);
    if (service) {
      services.push(service);
    }
  }

  return services;
}

function parseSSLine(line: string, interfaceMap: Map<string, string[]>): ListeningService | null {
  // Split by whitespace
  const parts = line.trim().split(/\s+/);

  if (parts.length < 5) {
    return null;
  }

  // Extract protocol (tcp or udp)
  const protocol = parts[0]?.toLowerCase();
  if (protocol !== "tcp" && protocol !== "udp") {
    return null;
  }

  // Extract local address:port (usually index 4 for ss -tulnp)
  // Format: "0.0.0.0:22" or "[::]:80" or "127.0.0.1:8080"
  let localAddrPart = parts[4];

  // Handle different formats in ss output
  if (!localAddrPart?.includes(":")) {
    // Try to find the Local Address:Port part
    for (let i = 3; i < parts.length; i++) {
      if (parts[i]?.includes(":")) {
        localAddrPart = parts[i];
        break;
      }
    }
  }

  if (!localAddrPart) {
    return null;
  }

  const { ip, port } = parseAddress(localAddrPart);
  if (port === null) {
    return null;
  }

  // Extract process info from the Process column
  // Format: users:(("sshd",pid=1234,fd=3))
  const processMatch = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
  const processName = processMatch?.[1] ?? "unknown";
  const pid = processMatch?.[2] ? Number.parseInt(processMatch[2], 10) : 0;

  // Map IP to interfaces
  const interfaces = mapIpToInterfaces(ip, interfaceMap);

  const service: ListeningService = {
    port,
    protocol: protocol as "tcp" | "udp",
    process: processName,
    pid,
    interfaces,
    boundIp: ip,
  };

  // Validate with zod
  const result = ListeningServiceSchema.safeParse(service);
  if (!result.success) {
    return null;
  }

  return service;
}

/**
 * Parse address:port string
 * Handles IPv4, IPv6, and wildcard addresses
 */
function parseAddress(addr: string): { ip: string; port: number | null } {
  // IPv6 format: [::]:80 or [::1]:8080
  const ipv6Match = addr.match(/^\[([^\]]+)\]:(\d+)$/);
  if (ipv6Match) {
    const port = Number.parseInt(ipv6Match[2] ?? "", 10);
    return {
      ip: normalizeIp(ipv6Match[1] ?? "::"),
      port: Number.isNaN(port) ? null : port,
    };
  }

  // IPv4 format: 0.0.0.0:22 or 127.0.0.1:8080
  const ipv4Match = addr.match(/^([^:]+):(\d+)$/);
  if (ipv4Match) {
    const port = Number.parseInt(ipv4Match[2] ?? "", 10);
    return {
      ip: normalizeIp(ipv4Match[1] ?? "0.0.0.0"),
      port: Number.isNaN(port) ? null : port,
    };
  }

  // Handle asterisk wildcard (some versions of ss)
  if (addr.startsWith("*:")) {
    const portStr = addr.slice(2);
    const port = Number.parseInt(portStr, 10);
    return {
      ip: "0.0.0.0",
      port: Number.isNaN(port) ? null : port,
    };
  }

  return { ip: "0.0.0.0", port: null };
}

function normalizeIp(ip: string): string {
  return ip.trim().toLowerCase();
}

/**
 * Map bound IP to network interface names
 *
 * Rules:
 * - 0.0.0.0 or :: → all public interfaces (eth0, ens3, etc.) + lo
 * - 127.0.0.1 or ::1 → localhost only
 * - Specific IP → lookup in interface map
 */
function mapIpToInterfaces(ip: string, interfaceMap: Map<string, string[]>): string[] {
  // Localhost
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return ["lo"];
  }

  // Wildcard - bind to all interfaces
  if (ip === "0.0.0.0" || ip === "::" || ip === "*") {
    const allInterfaces = new Set<string>();
    for (const ifaces of interfaceMap.values()) {
      for (const iface of ifaces) {
        allInterfaces.add(iface);
      }
    }
    return Array.from(allInterfaces);
  }

  // Specific IP - look up which interface(s) have this IP
  const interfaces = interfaceMap.get(ip);
  if (interfaces && interfaces.length > 0) {
    return interfaces;
  }

  // Unknown mapping - return empty and let exposure engine use conservative classification
  return [];
}
