/**
 * Unit tests for ss parser
 */

import { describe, expect, it } from "vitest";
import { parseSSOutput } from "../../src/system/parsers/ss-parser.js";

describe("ss-parser", () => {
  it("should parse tcp listening service", () => {
    const output = `Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
tcp   LISTEN 0      128    0.0.0.0:22          0.0.0.0:*     users:(("sshd",pid=1234,fd=3))`;

    const interfaceMap = new Map([
      ["0.0.0.0", ["eth0", "lo"]],
      ["127.0.0.1", ["lo"]],
    ]);

    const services = parseSSOutput(output, interfaceMap);

    expect(services).toHaveLength(1);
    expect(services[0]).toMatchObject({
      port: 22,
      protocol: "tcp",
      process: "sshd",
      pid: 1234,
      boundIp: "0.0.0.0",
    });
  });

  it("should parse localhost-bound service", () => {
    const output = `tcp   LISTEN 0      0      127.0.0.1:8080      0.0.0.0:*     users:(("node",pid=5678,fd=10))`;

    const interfaceMap = new Map([["127.0.0.1", ["lo"]]]);

    const services = parseSSOutput(output, interfaceMap);

    expect(services).toHaveLength(1);
    expect(services[0]?.interfaces).toEqual(["lo"]);
    expect(services[0]?.boundIp).toBe("127.0.0.1");
  });

  it("should handle multiple services", () => {
    const output = `Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
tcp   LISTEN 0      128    0.0.0.0:22          0.0.0.0:*     users:(("sshd",pid=1234,fd=3))
tcp   LISTEN 0      0      127.0.0.1:8080      0.0.0.0:*     users:(("node",pid=5678,fd=10))
udp   UNCONN 0      0      0.0.0.0:53          0.0.0.0:*     users:(("systemd-resolve",pid=999,fd=12))`;

    const interfaceMap = new Map([
      ["0.0.0.0", ["eth0", "lo"]],
      ["127.0.0.1", ["lo"]],
    ]);

    const services = parseSSOutput(output, interfaceMap);

    expect(services).toHaveLength(3);
    expect(services.map((s) => s.port)).toEqual([22, 8080, 53]);
    expect(services.map((s) => s.protocol)).toEqual(["tcp", "tcp", "udp"]);
  });

  it("should handle IPv6 addresses", () => {
    const output = `tcp   LISTEN 0      128    [::]:80             [::]:*        users:(("nginx",pid=2345,fd=5))`;

    const interfaceMap = new Map([["::", ["eth0", "lo"]]]);

    const services = parseSSOutput(output, interfaceMap);

    expect(services).toHaveLength(1);
    expect(services[0]).toMatchObject({
      port: 80,
      protocol: "tcp",
      process: "nginx",
      boundIp: "::",
    });
  });

  it("should skip invalid lines", () => {
    const output = `Netid State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
invalid line here
tcp   LISTEN 0      128    0.0.0.0:22          0.0.0.0:*     users:(("sshd",pid=1234,fd=3))
another invalid line`;

    const interfaceMap = new Map([["0.0.0.0", ["eth0", "lo"]]]);

    const services = parseSSOutput(output, interfaceMap);

    expect(services).toHaveLength(1);
    expect(services[0]?.port).toBe(22);
  });
});
