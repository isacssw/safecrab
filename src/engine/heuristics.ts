/**
 * Risk heuristics - composable security rules
 * Each rule returns Finding | null
 */

import type { Finding, FindingSeverity, NetworkContext, ServiceExposure } from "./types.js";

/**
 * Run all heuristics on service exposures
 * Returns findings sorted by severity (critical > warning > info)
 */
export function analyzeExposures(exposures: ServiceExposure[], context: NetworkContext): Finding[] {
  const findings: Finding[] = [];

  // Run heuristics in severity order
  for (const exposure of exposures) {
    // Critical rules
    const tunnelBypass = checkTunnelBypass(exposure);
    if (tunnelBypass) findings.push(tunnelBypass);

    const aiServiceExposure = checkHighRiskAIService(exposure);
    if (aiServiceExposure) findings.push(aiServiceExposure);

    // Warning rules
    const publicExposure = checkPublicExposure(exposure);
    if (publicExposure) findings.push(publicExposure);

    const tailscaleUnused = checkTailscaleUnused(exposure, context);
    if (tailscaleUnused) findings.push(tailscaleUnused);
  }

  // Add informational findings about context
  const contextFindings = generateContextFindings(context);
  findings.push(...contextFindings);

  // Deduplicate findings (same rule + same port = one finding)
  const deduplicated = deduplicateFindings(findings);

  // Sort by severity
  return sortBySeverity(deduplicated);
}

/**
 * Rule 1: Tunnel bypass (CRITICAL)
 * Service has both cloudflare-tunnel AND public-internet exposure
 */
function checkTunnelBypass(exposure: ServiceExposure): Finding | null {
  const { service, paths } = exposure;

  if (paths.includes("cloudflare-tunnel") && paths.includes("public-internet")) {
    return {
      severity: "critical",
      title: "Tunnel bypass detected",
      description: `Port ${service.port} (${service.process}) is accessible via both Cloudflare Tunnel and directly from the public internet. The tunnel does not protect this service.`,
      recommendation:
        "Bind the service to localhost (127.0.0.1) or restrict access via firewall to ensure traffic only flows through the tunnel.",
      service,
    };
  }

  return null;
}

/**
 * Rule 2: High-risk AI service exposure (CRITICAL)
 * AI/ML service exposed to public internet
 */
function checkHighRiskAIService(exposure: ServiceExposure): Finding | null {
  const { service, paths } = exposure;

  if (!paths.includes("public-internet")) {
    return null;
  }

  const highRiskProcesses = ["ollama", "llama", "python", "node", "uvicorn", "fastapi"];

  const isHighRisk = highRiskProcesses.some((risk) => service.process.toLowerCase().includes(risk));

  if (isHighRisk) {
    return {
      severity: "critical",
      title: "High-risk service publicly exposed",
      description: `Port ${service.port} (${service.process}) is reachable from the public internet. This process may be running AI models, APIs, or development servers that should not be publicly accessible.`,
      recommendation:
        "Bind to localhost, use a VPN (like Tailscale), or configure firewall rules to restrict access.",
      service,
    };
  }

  return null;
}

/**
 * Rule 3: Public exposure (WARNING)
 * Service exposed to public internet (but not high-risk)
 */
function checkPublicExposure(exposure: ServiceExposure): Finding | null {
  const { service, paths } = exposure;

  if (!paths.includes("public-internet")) {
    return null;
  }

  // Skip if already flagged as critical
  const highRiskProcesses = ["ollama", "llama", "python", "node", "uvicorn", "fastapi"];
  const isHighRisk = highRiskProcesses.some((risk) => service.process.toLowerCase().includes(risk));

  if (isHighRisk) {
    return null; // Already handled by checkHighRiskAIService
  }

  return {
    severity: "warning",
    title: "Service exposed to public internet",
    description: `Port ${service.port} (${service.process}) is accessible from the public internet.`,
    recommendation:
      "Verify this service should be publicly accessible. If not, bind to localhost or use firewall rules.",
    service,
  };
}

/**
 * Rule 4: Tailscale unused (WARNING)
 * Tailscale is connected but service uses public internet instead
 */
function checkTailscaleUnused(exposure: ServiceExposure, context: NetworkContext): Finding | null {
  const { service, paths } = exposure;

  if (!context.tailscale.connected) {
    return null;
  }

  if (!paths.includes("public-internet")) {
    return null;
  }

  if (paths.includes("tailscale")) {
    return null; // Already using Tailscale
  }

  return {
    severity: "warning",
    title: "Tailscale available but not used",
    description: `Port ${service.port} (${service.process}) is publicly accessible, but Tailscale is connected. Consider using Tailscale for secure access instead.`,
    recommendation: `Bind the service to the Tailscale interface or use Tailscale's subnet routing.`,
    service,
  };
}

/**
 * Deduplicate findings by (severity, title, port)
 * Prevents duplicate warnings for the same port (e.g. IPv4 + IPv6)
 */
function deduplicateFindings(findings: Finding[]): Finding[] {
  const seen = new Set<string>();
  const deduplicated: Finding[] = [];

  for (const finding of findings) {
    const key = `${finding.severity}:${finding.title}:${finding.service?.port ?? 0}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(finding);
    }
  }

  return deduplicated;
}

/**
 * Generate informational findings about network context
 */
function generateContextFindings(context: NetworkContext): Finding[] {
  const findings: Finding[] = [];

  // Firewall status
  if (!context.firewall.statusKnown) {
    // Could not determine firewall status (likely needs sudo)
    findings.push({
      severity: "warning",
      title: "Firewall status could not be determined",
      description: "Unable to read UFW status. This usually happens when running without root.",
      recommendation: "Run with sudo to see accurate UFW firewall status.",
      icon: "warning",
    });
  } else if (context.firewall.enabled) {
    // Firewall is active
    findings.push({
      severity: "info",
      title: "Firewall is enabled",
      description: `UFW firewall is active with default inbound policy: ${context.firewall.defaultInbound}.`,
    });
  } else {
    // Firewall is not active (negative finding)
    findings.push({
      severity: "warning",
      title: "No firewall detected",
      description: "UFW firewall is not active. All ports may be accessible from the internet.",
      recommendation: "Consider enabling UFW to control inbound traffic: sudo ufw enable",
      icon: "warning",
    });
  }

  // Tailscale status
  if (context.tailscale.connected) {
    findings.push({
      severity: "info",
      title: "Tailscale is connected",
      description: "Tailscale VPN is active and available for secure access.",
    });
  }

  // Cloudflare tunnel
  if (context.cloudflare.tunnelDetected) {
    findings.push({
      severity: "info",
      title: "Cloudflare Tunnel detected",
      description:
        "A Cloudflare Tunnel is present. Ensure services are only accessible through the tunnel.",
    });
  }

  return findings;
}

/**
 * Sort findings by severity: critical > warning > info
 */
function sortBySeverity(findings: Finding[]): Finding[] {
  const severityOrder: Record<FindingSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
