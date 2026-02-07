/**
 * Parser for ip addr output
 * Maps IP addresses to network interface names
 */

/**
 * Parse ip addr output to create a mapping of IP addresses to interface names
 *
 * Example output:
 * 1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
 *     inet 127.0.0.1/8 scope host lo
 * 2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP
 *     inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0
 * 3: tailscale0: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 1280 qdisc fq_codel state UNKNOWN
 *     inet 100.64.0.1/32 scope global tailscale0
 */
export function parseIPAddr(output: string): Map<string, string[]> {
  const ipToInterfaces = new Map<string, string[]>();
  const lines = output.split("\n");

  let currentInterface: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Interface line: "2: eth0: <BROADCAST,..."
    const ifaceMatch = trimmed.match(/^\d+:\s+([^:]+):/);
    if (ifaceMatch) {
      currentInterface = ifaceMatch[1]?.trim() ?? null;
      continue;
    }

    // IPv4 address line: "inet 192.168.1.100/24 ..."
    const inet4Match = trimmed.match(/^inet\s+([0-9.]+)/);
    if (inet4Match && currentInterface) {
      const ip = inet4Match[1];
      if (ip) {
        const interfaces = ipToInterfaces.get(ip) ?? [];
        interfaces.push(currentInterface);
        ipToInterfaces.set(ip, interfaces);
      }
      continue;
    }

    // IPv6 address line: "inet6 fe80::1/64 ..."
    const inet6Match = trimmed.match(/^inet6\s+([0-9a-f:]+)/);
    if (inet6Match && currentInterface) {
      const ip = inet6Match[1];
      if (ip) {
        const interfaces = ipToInterfaces.get(ip) ?? [];
        interfaces.push(currentInterface);
        ipToInterfaces.set(ip, interfaces);
      }
    }
  }

  return ipToInterfaces;
}

/**
 * Get list of all network interfaces from ip addr output
 */
export function getInterfaces(output: string): Array<{
  name: string;
  ips: string[];
  isPublic: boolean;
}> {
  const interfaces: Array<{ name: string; ips: string[]; isPublic: boolean }> = [];
  const ipMap = parseIPAddr(output);

  // Group by interface name
  const interfaceMap = new Map<string, string[]>();
  for (const [ip, ifaces] of ipMap.entries()) {
    for (const iface of ifaces) {
      const ips = interfaceMap.get(iface) ?? [];
      ips.push(ip);
      interfaceMap.set(iface, ips);
    }
  }

  for (const [name, ips] of interfaceMap.entries()) {
    interfaces.push({
      name,
      ips,
      isPublic: isPublicInterface(name, ips),
    });
  }

  return interfaces;
}

/**
 * Determine if an interface is public-facing
 * Private interfaces: lo, docker*, tailscale*, cloudflare*
 */
function isPublicInterface(name: string, ips: string[]): boolean {
  // Loopback
  if (name === "lo" || name.startsWith("lo:")) {
    return false;
  }

  // Virtual/tunnel interfaces
  if (
    name.startsWith("docker") ||
    name.startsWith("tailscale") ||
    name.startsWith("cloudflare") ||
    name.startsWith("veth") ||
    name.startsWith("br-")
  ) {
    return false;
  }

  // Check if all IPs are localhost
  const allLocalhost = ips.every((ip) => ip.startsWith("127.") || ip === "::1");
  if (allLocalhost) {
    return false;
  }

  return true;
}
