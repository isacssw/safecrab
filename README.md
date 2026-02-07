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

```bash
npm install -g safecrab
```

Or use directly with `npx`:

```bash
npx safecrab scan
```

## Usage

```bash
safecrab scan
```

For best visibility, run with root privileges:

```bash
sudo safecrab scan
```

> **Note**: Running without root may hide some services. Safecrab will warn you but continue with best-effort scanning.

## Example Output

```
🦀 Safecrab Security Scan

Summary:
  → 5 services detected
  → 2 publicly reachable
  → 1 critical issues

CRITICAL
✖ Tunnel bypass detected
  Port 3000 (ollama) is accessible via both Cloudflare Tunnel and directly
  from the public internet. The tunnel does not protect this service.

  Recommendation:
    Bind the service to localhost (127.0.0.1) or restrict access via firewall
    to ensure traffic only flows through the tunnel.

WARNINGS
⚠ Service exposed to public internet
  Port 22 (sshd) is accessible from the public internet.

  Recommendation:
    Verify this service should be publicly accessible. If not, bind to
    localhost or use firewall rules.

INFO
✔ Firewall is enabled
  UFW firewall is active with default inbound policy: deny.

✔ Tailscale is connected
  Tailscale VPN is active and available for secure access.

No changes were made to your system.
```

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

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/safecrab.git
cd safecrab

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

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
- JSON output for CI/CD integration
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
