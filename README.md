# 🦀 Safecrab

**Security scanner for Linux VPS environments** — Detect accidental service exposure and false security assumptions.

> "It's the eslint of server exposure."

Safecrab is a **read-only** CLI tool that reveals the truth about what services are actually reachable on your Linux VPS, even when you think they're protected by tunnels, VPNs, or firewalls.

## What It Does

Safecrab answers the critical question:

> **"What services are reachable, from where, and why?"**

Not just "Is the firewall enabled?"

### Key Features

- 🔍 **Detects listening services** (via `ss -tulnp`)
- 🌐 **Identifies exposure paths**: public internet, Tailscale, Cloudflare Tunnel, localhost
- 🚨 **Finds tunnel bypass scenarios**: When services are exposed publicly *despite* having tunnels
- 🤖 **Escalates AI/ML services**: Automatically treats exposed AI servers as critical risks
- 📊 **Beautiful terminal UI**: Clear, calm explanations without jargon
- 🔒 **100% read-only**: Makes zero system changes

## Installation

### Quick start (without sudo)

```bash
npm install -g safecrab
```

Or use directly with `npx`:

```bash
npx safecrab scan
```

### For use with sudo (recommended for full visibility)

To run `sudo safecrab scan`, install globally as root so the command is available system-wide:

```bash
sudo npm install -g safecrab
```

Then run:

```bash
sudo safecrab scan
```

> **Note**: If you installed as your user (without `sudo`), the `safecrab` command won't be available to root. Running `sudo safecrab` will show "command not found". Use the system-wide install above to fix this.

## Usage

```bash
safecrab scan
```

Options:

```bash
safecrab scan --verbose   # Show expanded why/context/details fields
safecrab scan --quiet     # Show only actionable findings
safecrab scan --json      # Emit machine-readable JSON report
```

For best visibility, run with root privileges:

```bash
sudo safecrab scan
```

> **Note**: Running without root may hide some services. Safecrab will warn you but continue with best-effort scanning.

## Example Output (Default)

```
🦀 Safecrab Security Scan

Summary:
  → 5 services detected
  → 2 publicly reachable
  → 1 critical issues
  → 2 warnings
  → 3 informational notes

Top actions:
  → Bind the service to localhost (127.0.0.1) or restrict access via firewall to ensure traffic only flows through the tunnel.
  → Use key-based authentication only (disable password auth).

CRITICAL
✖ Tunnel bypass detected
  Port 3000 (ollama) is accessible via both Cloudflare Tunnel and directly
  from the public internet. The tunnel does not protect this service.

  Recommendation:
    Bind the service to localhost (127.0.0.1) or restrict access via firewall
    to ensure traffic only flows through the tunnel.

WARNINGS
⚠ Service exposed to public internet
  Port 22 (sshd) (SSH remote access) appears reachable from the public internet.

  Action:
    Use key-based authentication only (disable password auth). Disable root login.

INFO
  3 informational notes hidden.
  Re-run with --verbose to see full details.
  → Firewall is enabled
  → Tailscale is connected
  → Cloudflare Tunnel detected

Environment notes
  ⚠ Running without root may hide some services and can show incomplete firewall or process info.
  For full visibility, re-run with sudo.

No changes were made to your system.
```

## Example Output (Verbose)

Use `--verbose` to expand `Why flagged`, `Confidence`, `Context`, and extended recommendation details.

## Example Output (JSON)

```bash
safecrab scan --json
```

Returns a JSON object with:
- report mode (`default`, `verbose`, or `quiet`)
- summary stats
- detected services
- findings
- top actions
- environment notes
- exit code
- output sanitization mode (`terminal-only`)

Note: terminal output is sanitized for control sequences. JSON output is raw structured data intended for machine consumers.

## Who Is This For?

Safecrab is designed for:

- **Developers** running AI models, APIs, or dev servers on VPS instances
- **Self-hosters** managing services like Ollama, Jupyter, or internal dashboards
- **Security-conscious users** who want visibility without complexity
- **Anyone** who has ever said: *"Oh wow, I thought this was private."*

## Common Scenarios Detected

### 1. Tunnel Bypass (Critical)

You set up a Cloudflare Tunnel but forgot to bind your service to localhost. **Safecrab detects both paths** and warns you.

### 2. Exposed AI Services (Critical)

Ollama, LLaMA, Python servers, Node.js apps exposed to the public internet are automatically escalated to critical severity.

### 3. Tailscale Available But Unused (Warning)

You have Tailscale connected but services are still publicly accessible instead of using the VPN.

### 4. SSH Without Firewall (Warning)

SSH port 22 is reachable from the public internet without firewall protection.

## What Safecrab Does NOT Do

- ❌ Modify system configuration
- ❌ Change firewall rules
- ❌ Restart services
- ❌ Require credentials
- ❌ Make network requests
- ❌ Write any files

**Safecrab is 100% read-only.** It only observes and reports.

## Known Detection Limits

Safecrab is conservative, but detection quality depends on host visibility and system command output formats:

- Running without root can hide services/process details and firewall state.
- Interface/address correlation is best-effort and may be incomplete on unusual network setups.
- Cloudflare Tunnel detection can be high-confidence (active process) or low-confidence (passive config evidence).
- Safecrab infers exposure from local system state; it does not perform active external probing.

## How It Works

1. **Collects system facts**: Network interfaces, listening services, firewall status
2. **Detects security context**: Tailscale, Cloudflare Tunnel, UFW status
3. **Resolves exposure paths**: Determines which services are reachable from where
4. **Applies risk heuristics**: Categorizes findings by severity
5. **Renders human-readable report**: Beautiful terminal output with clear explanations

## Exit Codes

- `0` — No critical issues found
- `1` — Critical security issues detected

Use in scripts:

```bash
safecrab scan
if [ $? -eq 1 ]; then
  echo "Critical security issues found!"
  exit 1
fi
```

## System Requirements

- **OS**: Linux (Ubuntu, Debian, or similar)
- **Runtime**: Node.js 20 or later
- **Commands**: `ss`, `ip` (standard on most Linux systems)
- **Optional**: `ufw`, `tailscale`, `cloudflared` for enhanced detection

## Troubleshooting

### `sudo: safecrab: command not found`

You installed globally as your user. The `safecrab` binary is in your user's PATH but not in root's PATH.

**Solution**: Install globally as root:

```bash
sudo npm install -g safecrab
```

Then run:

```bash
sudo safecrab scan
```

### `npm error config prefix cannot be changed from project config`

This error can appear when using `sudo npx safecrab scan` if npm picks up your user's npm config under sudo.

**Solution**: Use the global install approach instead of `npx`:

```bash
sudo npm install -g safecrab
sudo safecrab scan
```

Alternatively, if you don't need full visibility, run without sudo:

```bash
npx safecrab scan
```

## Development

```bash
# Clone the repository
git clone https://github.com/isacssw/safecrab.git
cd safecrab

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Validate release quality gate (lint + tests + build)
npm run verify:release

# Run locally
npm run build && node dist/cli/index.js scan
```

## Architecture

```
safecrab/
├── src/
│   ├── system/      # Layer 1: Raw system facts
│   ├── engine/      # Layer 2: Interpreted truth
│   └── ui/          # Layer 3: Human presentation
```

See the [project specification](SPEC.md) for detailed architecture.

## Philosophy

> **"Safecrab does not enforce security. It reveals truth."**

Safecrab helps you understand your actual security posture, not your assumed security posture. Enforcement comes later — first, you need visibility.

## Roadmap

**MVP (Current)**: Read-only scanning with beautiful terminal output

**Post-MVP**:
- Automated fix suggestions
- Config file support
- GitHub Actions integration
- Single binary distribution

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT

## Credits

Built with love for the self-hosting and security-conscious community.

---

**If you found a service you didn't know was exposed, Safecrab succeeded.** ✨
