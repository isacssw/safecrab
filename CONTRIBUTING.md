# Contributing to Safecrab

Thank you for your interest in contributing to Safecrab! This document provides guidelines and instructions for contributing.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/yourusername/safecrab.git
   cd safecrab
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Build the project**:
   ```bash
   npm run build
   ```
5. **Run tests**:
   ```bash
   npm test
   ```

## Development Workflow

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the code style guidelines below

3. **Write tests** for new functionality

4. **Ensure tests pass**:
   ```bash
   npm test
   ```

5. **Lint and format**:
   ```bash
   npm run lint:fix
   npm run format
   ```

6. **Build and test locally**:
   ```bash
   npm run build
   node dist/cli/index.js scan
   ```

7. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add support for XYZ detection"
   ```

8. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

9. **Open a Pull Request** on GitHub

## Code Style Guidelines

- **TypeScript**: Strict mode, no `any` types without justification
- **Formatting**: Use Biome for formatting (automatic via `npm run format`)
- **Imports**: Use ESM imports with `.js` extensions
- **Naming**: 
  - Functions: `camelCase`
  - Types/Interfaces: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for config objects

## Architecture Principles

### Layer Separation

Never skip layers. Transformations must be explicit:

1. **System Layer** (`src/system/`): Raw facts from shell commands
2. **Engine Layer** (`src/engine/`): Interpreted truth and logic
3. **UI Layer** (`src/ui/`): Human-readable presentation

For CLI UX/UI work, follow this low-risk sequence:
1. Add or adjust CLI flags in `src/cli/index.ts`.
2. Wire command behavior in `src/cli/commands/scan.ts`.
3. Update output contracts in `src/ui/renderer.ts`.
4. Tune section layouts in `src/ui/summary.ts` and `src/ui/findings.ts`.
5. Adjust recommendation/copy wording in `src/engine/heuristics.ts` or `src/engine/port-profiles.ts` only when needed.

### Read-Only Guarantee

Safecrab is **100% read-only**. Any contribution that modifies system state will be rejected.

### Trust-Building Language

Use calm, explanatory language:
- ✅ "This service is reachable because..."
- ❌ "DANGER! CRITICAL VULNERABILITY!"

Avoid fear-mongering. Focus on education.

### CLI Copy Guidelines

When writing or editing finding text in `src/engine` and `src/ui`:
- Lead with the plain-English outcome first (what is exposed and why it matters).
- Keep default output concise and action-oriented.
- Put one immediate step under `Action:` and reserve deeper reasoning for verbose mode.
- Keep recommendations imperative and short in the first sentence.
- Prefer neutral confidence language (`low`, `medium`, `high`) over alarmist wording.

## Testing Guidelines

- **Unit tests** for parsers, heuristics, and pure logic
- **Integration tests** for collectors (with mocked shell commands)
- **Snapshot tests** for UI output
- Aim for 80%+ code coverage on critical paths

### CLI UX Validation Checklist

For changes that affect terminal output, validate these scenarios locally:

```bash
npm run build
node dist/cli/index.js scan --help
node dist/cli/index.js scan
node dist/cli/index.js scan --verbose
node dist/cli/index.js scan --quiet
node dist/cli/index.js scan --json
```

Acceptance checks:
- Default output shows summary, top actions, expanded critical/warning findings, and collapsed info.
- `--verbose` expands `Why flagged`, `Confidence`, `Context`, and recommendation details.
- `--quiet` removes non-essential sections and keeps actionable findings only.
- `--json` emits valid JSON with stats, findings, and exit-code semantics intact.
- Exit code remains `1` when critical findings exist; otherwise `0`.

## Types of Contributions

### Bug Reports

Please include:
- Safecrab version
- Linux distribution and version
- Command output (if relevant)
- Expected vs actual behavior

### Feature Requests

Before submitting, check:
- Is this in scope for MVP? (See README for post-MVP features)
- Does it maintain read-only guarantee?
- Does it align with the "reveal truth" philosophy?

### Code Contributions

Great areas to contribute:
- **New heuristics**: Additional security detection rules
- **Parser improvements**: Better handling of edge cases
- **New collectors**: Support for additional VPN/tunnel tools
- **Test coverage**: More comprehensive test suites
- **Documentation**: Clearer explanations and examples

### What NOT to Contribute (MVP)

These are explicitly post-MVP:
- Configuration files
- Automated fixes
- System modifications
- Web UI

## Commit Message Convention

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `refactor:` Code refactoring
- `chore:` Tooling/build changes

Examples:
```
feat: add iptables detection support
fix: handle IPv6 addresses in ss parser
docs: improve installation instructions
test: add edge cases for tunnel detection
```

## Pull Request Guidelines

- Keep PRs focused and small when possible
- Include tests for new functionality
- Update documentation if behavior changes
- Ensure CI passes (tests + lint)
- Reference related issues if applicable

## Questions?

Open an issue with the `question` label or start a discussion.

## Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something useful.

Thank you for contributing! 🦀
