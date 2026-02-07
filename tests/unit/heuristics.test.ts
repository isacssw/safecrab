/**
 * Unit tests for risk heuristics
 */

import { describe, expect, it } from "vitest";
import { analyzeExposures } from "../../src/engine/heuristics.js";
import type { NetworkContext, ServiceExposure } from "../../src/engine/types.js";

describe("risk heuristics", () => {
  const mockContext: NetworkContext = {
    firewall: {
      enabled: false,
      defaultInbound: "allow",
      statusKnown: true,
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

  it("should detect tunnel bypass as critical", () => {
    const exposure: ServiceExposure = {
      service: {
        port: 3000,
        protocol: "tcp",
        process: "node",
        pid: 1234,
        interfaces: ["eth0"],
        boundIp: "0.0.0.0",
      },
      paths: ["cloudflare-tunnel", "public-internet"],
    };

    const contextWithTunnel: NetworkContext = {
      ...mockContext,
      cloudflare: { tunnelDetected: true },
    };

    const findings = analyzeExposures([exposure], contextWithTunnel);

    const critical = findings.filter((f) => f.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
    expect(critical.some((f) => f.title.includes("bypass"))).toBe(true);
  });

  it("should escalate AI services to critical", () => {
    const exposure: ServiceExposure = {
      service: {
        port: 11434,
        protocol: "tcp",
        process: "ollama",
        pid: 5678,
        interfaces: ["eth0"],
        boundIp: "0.0.0.0",
      },
      paths: ["public-internet"],
    };

    const findings = analyzeExposures([exposure], mockContext);

    const critical = findings.filter((f) => f.severity === "critical");
    expect(critical.length).toBeGreaterThan(0);
    expect(critical.some((f) => f.title.includes("High-risk service"))).toBe(true);
  });

  it("should warn about public exposure", () => {
    const exposure: ServiceExposure = {
      service: {
        port: 80,
        protocol: "tcp",
        process: "nginx",
        pid: 999,
        interfaces: ["eth0"],
        boundIp: "0.0.0.0",
      },
      paths: ["public-internet"],
    };

    const findings = analyzeExposures([exposure], mockContext);

    const warnings = findings.filter((f) => f.severity === "warning");
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("should warn when tailscale is available but unused", () => {
    const exposure: ServiceExposure = {
      service: {
        port: 8080,
        protocol: "tcp",
        process: "node",
        pid: 1234,
        interfaces: ["eth0"],
        boundIp: "0.0.0.0",
      },
      paths: ["public-internet"],
    };

    const contextWithTailscale: NetworkContext = {
      ...mockContext,
      tailscale: {
        installed: true,
        connected: true,
        interface: "tailscale0",
      },
    };

    const findings = analyzeExposures([exposure], contextWithTailscale);

    const warnings = findings.filter((f) => f.severity === "warning");
    expect(warnings.some((f) => f.title.includes("Tailscale"))).toBe(true);
  });

  it("should generate context info findings", () => {
    const findings = analyzeExposures([], mockContext);

    const info = findings.filter((f) => f.severity === "info");
    expect(info.length).toBeGreaterThan(0);
  });

  it("should sort findings by severity", () => {
    const exposures: ServiceExposure[] = [
      {
        service: {
          port: 22,
          protocol: "tcp",
          process: "sshd",
          pid: 1,
          interfaces: ["eth0"],
          boundIp: "0.0.0.0",
        },
        paths: ["public-internet"],
      },
      {
        service: {
          port: 3000,
          protocol: "tcp",
          process: "ollama",
          pid: 2,
          interfaces: ["eth0"],
          boundIp: "0.0.0.0",
        },
        paths: ["public-internet"],
      },
    ];

    const findings = analyzeExposures(exposures, mockContext);

    // Critical findings should come first
    expect(findings[0]?.severity).toBe("critical");
  });

  it("should deduplicate findings for same port (IPv4 + IPv6)", () => {
    // Same port on both IPv4 and IPv6 (like ss shows 0.0.0.0:22 and [::]:22)
    const exposures: ServiceExposure[] = [
      {
        service: {
          port: 22,
          protocol: "tcp",
          process: "sshd",
          pid: 1234,
          interfaces: ["eth0"],
          boundIp: "0.0.0.0",
        },
        paths: ["public-internet"],
      },
      {
        service: {
          port: 22,
          protocol: "tcp",
          process: "sshd",
          pid: 1234,
          interfaces: ["eth0"],
          boundIp: "::",
        },
        paths: ["public-internet"],
      },
    ];

    const findings = analyzeExposures(exposures, mockContext);

    // Should have only one "Service exposed to public internet" for port 22
    const publicExposureFindings = findings.filter(
      (f) => f.title === "Service exposed to public internet" && f.service?.port === 22
    );
    expect(publicExposureFindings.length).toBe(1);
  });

  it("should use warning icon for unknown firewall status", () => {
    const contextUnknownFirewall: NetworkContext = {
      ...mockContext,
      firewall: {
        enabled: false,
        defaultInbound: "unknown",
        statusKnown: false,
      },
    };

    const findings = analyzeExposures([], contextUnknownFirewall);

    const firewallFinding = findings.find((f) => f.title.includes("Firewall status"));
    expect(firewallFinding).toBeDefined();
    expect(firewallFinding?.icon).toBe("warning");
  });

  it("should use warning icon for no firewall detected", () => {
    const findings = analyzeExposures([], mockContext);

    const firewallFinding = findings.find((f) => f.title === "No firewall detected");
    expect(firewallFinding).toBeDefined();
    expect(firewallFinding?.icon).toBe("warning");
  });
});
