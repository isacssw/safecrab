/**
 * Unit tests for exposure resolution
 */

import { describe, expect, it } from "vitest";
import { resolveExposure } from "../../src/engine/exposure.js";
import type { ListeningService, NetworkContext } from "../../src/engine/types.js";

describe("exposure resolution", () => {
  const mockContext: NetworkContext = {
    firewall: {
      enabled: false,
      defaultInbound: "allow",
    },
    tailscale: {
      installed: false,
      connected: false,
    },
    cloudflare: {
      tunnelDetected: false,
    },
    interfaces: [
      { name: "lo", ips: ["127.0.0.1"], isPublic: false },
      { name: "eth0", ips: ["192.168.1.100"], isPublic: true },
    ],
  };

  it("should identify localhost-only service", () => {
    const service: ListeningService = {
      port: 8080,
      protocol: "tcp",
      process: "node",
      pid: 1234,
      interfaces: ["lo"],
      boundIp: "127.0.0.1",
    };

    const paths = resolveExposure(service, mockContext);

    expect(paths).toEqual(["localhost-only"]);
  });

  it("should identify public internet exposure", () => {
    const service: ListeningService = {
      port: 22,
      protocol: "tcp",
      process: "sshd",
      pid: 1234,
      interfaces: ["eth0", "lo"],
      boundIp: "0.0.0.0",
    };

    const paths = resolveExposure(service, mockContext);

    expect(paths).toContain("public-internet");
  });

  it("should identify tailscale exposure", () => {
    const contextWithTailscale: NetworkContext = {
      ...mockContext,
      tailscale: {
        installed: true,
        connected: true,
        interface: "tailscale0",
      },
      interfaces: [
        ...mockContext.interfaces,
        { name: "tailscale0", ips: ["100.64.0.1"], isPublic: false },
      ],
    };

    const service: ListeningService = {
      port: 3000,
      protocol: "tcp",
      process: "ollama",
      pid: 5678,
      interfaces: ["tailscale0", "eth0"],
      boundIp: "0.0.0.0",
    };

    const paths = resolveExposure(service, contextWithTailscale);

    expect(paths).toContain("tailscale");
    expect(paths).toContain("public-internet");
  });

  it("should detect cloudflare tunnel", () => {
    const contextWithCF: NetworkContext = {
      ...mockContext,
      cloudflare: {
        tunnelDetected: true,
      },
    };

    const service: ListeningService = {
      port: 80,
      protocol: "tcp",
      process: "nginx",
      pid: 999,
      interfaces: ["eth0"],
      boundIp: "0.0.0.0",
    };

    const paths = resolveExposure(service, contextWithCF);

    expect(paths).toContain("cloudflare-tunnel");
    expect(paths).toContain("public-internet");
  });
});
