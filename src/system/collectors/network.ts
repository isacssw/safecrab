/**
 * Collector for network interface information
 */

import { getInterfaces } from "../parsers/ip-parser.js";
import { execCommand } from "../shell.js";

export interface NetworkInterface {
  name: string;
  ips: string[];
  isPublic: boolean;
}

export async function collectNetworkInterfaces(): Promise<NetworkInterface[]> {
  try {
    const result = await execCommand("ip", ["addr"], { ignoreErrors: true });

    if (!result.success) {
      return [];
    }

    return getInterfaces(result.stdout);
  } catch (error) {
    return [];
  }
}
