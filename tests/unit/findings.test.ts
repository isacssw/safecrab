import { describe, expect, it } from "vitest";
import type { Finding } from "../../src/engine/types.js";
import { renderFindings } from "../../src/ui/findings.js";

describe("findings renderer sanitization", () => {
  it("should remove terminal control sequences from finding text", () => {
    const malicious: Finding = {
      severity: "warning",
      title: "Injected\u001b[31mTitle",
      description: "Port 3000 (\u001b]2;pwnd\u0007node) appears reachable.\u0007",
      recommendation: "Bind locally.\u001b[2J",
    };

    const output = renderFindings([malicious], { verbose: true, quiet: false });

    expect(output).not.toContain("\u001b[31m");
    expect(output).not.toContain("\u001b]2;pwnd");
    expect(output).not.toContain("\u001b[2J");
    expect(output).toContain("InjectedTitle");
    expect(output).toContain("Bind locally.");
  });
});
