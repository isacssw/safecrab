/**
 * Exposure resolution logic
 * Determines which exposure paths each service has
 */

import type { ExposurePath, ListeningService, NetworkContext, ServiceExposure } from "./types.js";

/**
 * Resolve exposure paths for a listening service
 *
 * Logic:
 * - 127.0.0.1 binding → localhost-only
 * - Public interface + firewall allows → public-internet
 * - tailscale0 interface → tailscale
 * - Cloudflare tunnel detected → cloudflare-tunnel
 *
 * Multiple paths can coexist (e.g., tunnel + public = bypass)
 */
export function resolveExposure(
  service: ListeningService,
  context: NetworkContext
): ExposurePath[] {
  const paths: ExposurePath[] = [];

  // Check if localhost only
  if (isLocalhostOnly(service)) {
    return ["localhost-only"];
  }

  // Check for Tailscale exposure
  if (isTailscaleExposed(service, context)) {
    paths.push("tailscale");
  }

  // Check for Cloudflare tunnel
  if (context.cloudflare.tunnelDetected) {
    paths.push("cloudflare-tunnel");
  }

  // Check for public internet exposure
  if (isPublicExposed(service, context)) {
    paths.push("public-internet");
  }

  // If no paths determined, assume localhost
  if (paths.length === 0) {
    return ["localhost-only"];
  }

  return paths;
}

/**
 * Check if service is localhost-only
 */
function isLocalhostOnly(service: ListeningService): boolean {
  // Bound to localhost IP
  if (
    service.boundIp === "127.0.0.1" ||
    service.boundIp === "::1" ||
    service.boundIp === "localhost"
  ) {
    return true;
  }

  // Only bound to loopback interface
  if (service.interfaces.length === 1 && service.interfaces[0] === "lo") {
    return true;
  }

  return false;
}

/**
 * Check if service is exposed via Tailscale
 */
function isTailscaleExposed(service: ListeningService, context: NetworkContext): boolean {
  if (!context.tailscale.connected) {
    return false;
  }

  const tailscaleInterface = context.tailscale.interface ?? "tailscale0";

  // Service is bound to tailscale interface
  return service.interfaces.includes(tailscaleInterface);
}

/**
 * Check if service is exposed to public internet
 */
function isPublicExposed(service: ListeningService, context: NetworkContext): boolean {
  // Check if bound to any public interface
  const hasPublicInterface = service.interfaces.some((iface) => {
    const interfaceInfo = context.interfaces.find((i) => i.name === iface);
    return interfaceInfo?.isPublic ?? false;
  });

  if (!hasPublicInterface) {
    return false;
  }

  // If firewall is enabled with deny default, service might be blocked
  // However, we assume public exposure unless explicitly proven otherwise
  // (conservative security assumption)

  // If firewall explicitly allows all, definitely exposed
  if (context.firewall.defaultInbound === "allow") {
    return true;
  }

  // If firewall denies by default, still assume exposed
  // (we can't determine specific rules without deep inspection)
  // This is intentionally conservative
  return true;
}

/**
 * Resolve exposure for all services
 */
export function resolveAllExposures(
  services: ListeningService[],
  context: NetworkContext
): ServiceExposure[] {
  return services.map((service) => ({
    service,
    paths: resolveExposure(service, context),
  }));
}
