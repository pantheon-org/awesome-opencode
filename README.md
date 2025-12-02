# Awesome OpenCode

![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/pantheon-org/awesome-opencode/main/.github/badges/coverage.json)
![Security Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/pantheon-org/awesome-opencode/main/.github/badges/security-coverage.json)
[![Security Tests](https://github.com/pantheon-org/awesome-opencode/actions/workflows/security-tests.yml/badge.svg)](https://github.com/pantheon-org/awesome-opencode/actions/workflows/security-tests.yml)
[![Security Lint](https://github.com/pantheon-org/awesome-opencode/actions/workflows/security-lint.yml/badge.svg)](https://github.com/pantheon-org/awesome-opencode/actions/workflows/security-lint.yml)

A curated list of tools related to [OpenCode](https://opencode.ai/) and similar AI-powered coding assistants.

> **⚠️ Breaking Changes Notice**: This project recently underwent a major architecture refactoring. If you were using imports from this package, please refer to the [Migration Guide](docs/MIGRATION_GUIDE.md) for updated import paths.

## Contributing

Found an awesome tool? Submit it by [creating an issue](../../issues/new/choose) with the tool's GitHub repository URL.
Our automated workflow will review, categorize, and add it to the list.

For detailed contributing guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Architecture

This project is organized around clear domain boundaries for maintainability and extensibility:

```
src/
├── domain/           # Core business logic (categories, themes, tools, tags)
├── security/        # Prompt injection prevention and rate limiting
├── validation/      # JSON schema validation and data integrity checks
├── reporting/       # Analysis and reporting utilities
├── monitoring/      # Logging and metrics collection
├── io/              # File operations and data parsing
└── index.ts         # Public API exports

.github/actions/     # GitHub Actions for automated workflows
├── load-workflow-data/    # Load and format data for CI workflows
├── format-prompt-data/    # Format data for AI prompts
├── sync-readme/           # Keep README synchronized
├── validate-data/         # Validate data files
└── validate-github-url/   # Validate GitHub URLs
```

For a detailed architecture overview, see [ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Quick Import Guide

The main library exports core functionality for external consumers:

```typescript
// Domain logic
import { loadCategories, getActiveThemes, formatThemesForPrompt } from 'awesome-opencode/domain';

// Security & validation
import { sanitizeForPrompt, validateThemes } from 'awesome-opencode/security';

// Reporting
import { analyzeThemes, generateSecurityReport } from 'awesome-opencode/reporting';

// Or use the main export
import * as awesome from 'awesome-opencode';
```

#### Migrating from Old Import Paths

If you were using the package before the v0.0.1 refactoring, see the [Migration Guide](docs/MIGRATION_GUIDE.md) for old→new import mappings:

- `src/category/` → `src/domain/categories/`
- `src/theme/` → `src/domain/themes/`
- `src/bin/analyze-themes.ts` → `src/reporting/theme-analysis/`
- `src/bin/generate-security-report.ts` → `src/reporting/security-analysis/`

## Development

### Pre-commit Hooks

This project uses [Lefthook](https://github.com/evilmartians/lefthook) to run pre-commit hooks that automatically validate data files before commits.

**What gets validated:**

- JSON schema validation for `data/*.json` files
- Security checks for injection patterns
- JSON formatting (auto-fixed by prettier)
- Code style (ESLint, Prettier)
- Markdown and YAML linting

**If validation fails:**

```bash
# Auto-fix formatting issues
bun run fix:data

# Manually review and fix remaining issues
# Then stage and commit again
git add data/*.json
git commit -m "Your message"
```

**Manual validation:**

```bash
# Validate all data files
bun run validate:data

# Fix formatting and common issues
bun run fix:data
```

**Emergency bypass (use sparingly):**

```bash
git commit --no-verify -m "Emergency fix"
```

### Security Monitoring

Monitor security events and view the security dashboard:

```bash
# View auto-generated security dashboard
open docs/security-dashboard.md

# Generate dashboard with custom time range
bun run security:dashboard --days 30

# Real-time log monitoring (development)
bun run security:monitor --level WARN

# Analyze historical security data
bun run security:analyze --days 90

# Generate detailed security report
bun run security:report
```

For more information, see [SECURITY.md](SECURITY.md#security-monitoring-and-logging).

## Browse by Theme

Discover tools organized by their primary purpose and philosophy:

### 🤖 [AI-Powered Development](docs/themes/ai-powered-development.md)

Tools that leverage artificial intelligence and machine learning to enhance coding workflows, from code generation to automated refactoring.

**Related categories:** Ai Coding Assistants, Code Analysis Quality

### ⚡ [Developer Productivity](docs/themes/developer-productivity.md)

Tools focused on streamlining development workflows, reducing manual tasks, and accelerating software delivery.

**Related categories:** Development Automation, Ide Extensions, Testing Tools

### 🔒 [Code Quality & Security](docs/themes/code-quality-security.md)

Tools that analyze code for quality issues, security vulnerabilities, and enforce best practices.

**Related categories:** Code Analysis Quality, Testing Tools

## Categories

### AI Coding Assistants

Tools that provide AI-powered code completion, generation, and assistance.

### Code Analysis & Quality

Tools for analyzing code quality, detecting issues, and improving codebases.

### Development Automation

Tools that automate development workflows and processes.

### Documentation Tools

Tools for generating and managing code documentation.

### Testing Tools

Tools for automated testing and quality assurance.

### IDE Extensions

Extensions and plugins for various IDEs and editors.

## License

[![CC0](https://licensebuttons.net/p/zero/1.0/88x31.png)](https://creativecommons.org/publicdomain/zero/1.0/)

To the extent possible under law, the contributors have waived all copyright and related rights to this work.
