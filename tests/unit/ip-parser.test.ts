/**
 * Unit tests for ip addr parser
 */

import { describe, expect, it } from "vitest";
import { getInterfaces, parseIPAddr } from "../../src/system/parsers/ip-parser.js";

describe("ip-parser", () => {
  it("should parse ip addr output", () => {
    const output = `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP
    inet 192.168.1.100/24 brd 192.168.1.255 scope global eth0`;

    const ipMap = parseIPAddr(output);

    expect(ipMap.get("127.0.0.1")).toEqual(["lo"]);
    expect(ipMap.get("192.168.1.100")).toEqual(["eth0"]);
  });

  it("should handle multiple IPs on same interface", () => {
    const output = `1: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP>
    inet 192.168.1.100/24 scope global eth0
    inet 10.0.0.5/24 scope global eth0`;

    const ipMap = parseIPAddr(output);

    expect(ipMap.get("192.168.1.100")).toEqual(["eth0"]);
    expect(ipMap.get("10.0.0.5")).toEqual(["eth0"]);
  });

  it("should parse tailscale interface", () => {
    const output = `3: tailscale0: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP>
    inet 100.64.0.1/32 scope global tailscale0`;

    const ipMap = parseIPAddr(output);

    expect(ipMap.get("100.64.0.1")).toEqual(["tailscale0"]);
  });

  it("should identify public vs private interfaces", () => {
    const output = `1: lo: <LOOPBACK,UP,LOWER_UP>
    inet 127.0.0.1/8 scope host lo
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP>
    inet 192.168.1.100/24 scope global eth0
3: tailscale0: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP>
    inet 100.64.0.1/32 scope global tailscale0`;

    const interfaces = getInterfaces(output);

    const lo = interfaces.find((i) => i.name === "lo");
    const eth0 = interfaces.find((i) => i.name === "eth0");
    const tailscale0 = interfaces.find((i) => i.name === "tailscale0");

    expect(lo?.isPublic).toBe(false);
    expect(eth0?.isPublic).toBe(true);
    expect(tailscale0?.isPublic).toBe(false);
  });

  it("should normalize IPv6 variants and strip zone identifiers", () => {
    const output = `2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP>
    inet6 FE80::ABCD%eth0/64 scope link
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP>
    inet6 2001:DB8::1/64 scope global`;

    const ipMap = parseIPAddr(output);

    expect(ipMap.get("fe80::abcd")).toEqual(["eth0"]);
    expect(ipMap.get("2001:db8::1")).toEqual(["wlan0"]);
  });
});
