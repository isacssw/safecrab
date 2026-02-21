import { beforeEach, describe, expect, it, vi } from "vitest";

const mockExecCommand = vi.fn();
const mockAccess = vi.fn();

vi.mock("../../src/system/shell.js", () => ({
  execCommand: (...args: unknown[]) => mockExecCommand(...args),
}));

vi.mock("node:fs/promises", () => ({
  access: (...args: unknown[]) => mockAccess(...args),
  constants: { F_OK: 0 },
}));

import { collectCloudflareStatus } from "../../src/system/collectors/cloudflare.js";

describe("cloudflare collector", () => {
  beforeEach(() => {
    mockExecCommand.mockReset();
    mockAccess.mockReset();
  });

  it("should detect high confidence tunnel when cloudflared process is running", async () => {
    mockExecCommand.mockResolvedValue({
      success: true,
      stdout: "COMMAND         COMMAND\ncloudflared     /usr/bin/cloudflared tunnel run",
    });
    mockAccess.mockRejectedValue(new Error("not found"));

    const result = await collectCloudflareStatus();

    expect(result.tunnelDetected).toBe(true);
    expect(result.detectionConfidence).toBe("high");
    expect(result.evidence).toContain("process");
  });

  it("should detect low confidence tunnel from complete config footprint", async () => {
    mockExecCommand.mockResolvedValue({
      success: true,
      stdout: "COMMAND         COMMAND\nbash            -zsh",
    });
    mockAccess.mockImplementation(async (path: string) => {
      if (path === "/etc/cloudflared" || path === "/etc/cloudflared/config.yml") {
        return;
      }
      throw new Error("not found");
    });

    const result = await collectCloudflareStatus();

    expect(result.tunnelDetected).toBe(true);
    expect(result.detectionConfidence).toBe("low");
    expect(result.evidence).toContain("config-dir");
    expect(result.evidence).toContain("config-file");
  });

  it("should avoid false positives when only config directory exists", async () => {
    mockExecCommand.mockResolvedValue({
      success: true,
      stdout: "COMMAND         COMMAND\nnode            app.js",
    });
    mockAccess.mockImplementation(async (path: string) => {
      if (path === "/etc/cloudflared") {
        return;
      }
      throw new Error("not found");
    });

    const result = await collectCloudflareStatus();

    expect(result.tunnelDetected).toBe(false);
    expect(result.detectionConfidence).toBe("low");
  });
});
