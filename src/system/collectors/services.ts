/**
 * Collector for listening services via ss -tulnp
 */

import type { ListeningService } from "../../engine/types.js";
import { parseIPAddr } from "../parsers/ip-parser.js";
import { parseSSOutput } from "../parsers/ss-parser.js";
import { execCommand } from "../shell.js";

export async function collectListeningServices(): Promise<ListeningService[]> {
  try {
    // First, get IP to interface mapping
    const ipAddrResult = await execCommand("ip", ["addr"], {
      ignoreErrors: true,
    });

    const interfaceMap = ipAddrResult.success
      ? parseIPAddr(ipAddrResult.stdout)
      : new Map<string, string[]>();

    // Get listening services
    const ssResult = await execCommand("ss", ["-tulnp"], {
      ignoreErrors: true,
    });

    if (!ssResult.success) {
      return [];
    }

    const services = parseSSOutput(ssResult.stdout, interfaceMap);
    return services;
  } catch (error) {
    // Best-effort: return empty array on failure
    return [];
  }
}
