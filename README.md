# Awesome OpenCode

A curated list of tools related to [OpenCode](https://opencode.ai/) and similar AI-powered coding assistants.

## Contributing

Found an awesome tool? Submit it by [creating an issue](../../issues/new/choose) with the tool's GitHub repository URL.
Our automated workflow will review, categorize, and add it to the list.

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

## Browse by Theme

Discover tools organized by their primary purpose and philosophy:

### 🤖 [AI-Powered Development](docs/themes/ai-powered-development.md)

Tools leveraging AI and machine learning to enhance coding workflows, from intelligent code completion to automated refactoring.

**Related categories:** AI Coding Assistants, Code Analysis & Quality

### ⚡ [Developer Productivity](docs/themes/developer-productivity.md)

Tools focused on streamlining development workflows, reducing manual tasks, and accelerating software delivery.

**Related categories:** Development Automation, IDE Extensions, Testing Tools

### 🔒 [Code Quality & Security](docs/themes/code-quality-security.md)

Tools that analyze code for quality issues, security vulnerabilities, and enforce best practices.

**Related categories:** Code Analysis & Quality, Testing Tools

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
