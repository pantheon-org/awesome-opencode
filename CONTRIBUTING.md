# Contributing to Awesome OpenCode

Thank you for your interest in contributing to Awesome OpenCode! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Security Requirements](#security-requirements)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## Code of Conduct

By participating in this project, you agree to maintain a welcoming and inclusive environment for all contributors.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/awesome-opencode.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests and ensure they pass
6. Submit a pull request

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.1.38 or later
- Git

### Installation

```bash
# Install dependencies
bun install

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Check coverage ratchet
bun run test:ratchet

# Run type checking
bun run typecheck

# Run linting
bun run lint

# Format code
bun run format
```

### Pre-commit Hooks

This project uses [Lefthook](https://github.com/evilmartians/lefthook) for pre-commit hooks. Hooks are automatically installed when you run `bun install`.

Pre-commit hooks will:

- Validate data files (categories.json, themes.json)
- Check for prompt injection vulnerabilities
- Enforce code formatting
- Run type checking

To bypass hooks in emergencies (not recommended):

```bash
git commit --no-verify
```

## Security Requirements

**Security is a top priority for this project.** All contributions must maintain or improve the security posture.

### Security Testing Checklist

Before submitting a PR that touches security-sensitive code, ensure:

- [ ] All security tests pass: `bun test src/security/`
- [ ] Coverage ratchet passes: `bun run test:ratchet`
- [ ] No hardcoded secrets or API keys
- [ ] All user inputs are sanitized
- [ ] No dangerous patterns (eval, exec with unsanitized input)
- [ ] Integration tests cover new security scenarios

### Security Modules

The following modules are considered security-critical and require extra scrutiny:

- `src/security/` - Prompt injection prevention and sanitization
- `src/validation/` - Data validation with injection detection
- `.github/scripts/` - Workflow scripts that handle user input

### Coverage Requirements

Security modules must maintain **minimum 90% code coverage**:

- `src/security/`: 90%+ functions and lines
- `src/validation/`: 90%+ functions and lines

The coverage ratchet enforces that coverage never decreases. If you add new code, ensure it's thoroughly tested.

### Running Security Tests

```bash
# Run security tests only
bun test src/security/

# Run validation tests
bun test src/validation/

# Run integration tests
bun test tests/integration/

# Run all tests with coverage
bun test --coverage

# Check coverage ratchet (enforces minimum coverage)
bun run test:ratchet
```

### Security Lint Checks

The CI/CD pipeline includes security lint checks that will:

- Detect hardcoded API keys and secrets
- Flag dangerous eval() usage
- Verify sanitization in workflow scripts
- Check for potential injection patterns

These checks run automatically on every PR. Fix any warnings or errors before merging.

## Testing Requirements

### Test Coverage

All new code should include tests. The project maintains high test coverage:

- Overall: 99%+ coverage
- Security modules: 96%+ coverage
- New features: 80%+ coverage minimum

### Writing Tests

Use Bun's built-in test runner:

```typescript
import { describe, test, expect } from 'bun:test';

describe('MyFeature', () => {
  test('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Test Organization

```
tests/
├── integration/        # Integration tests
│   └── security.test.ts
src/
├── security/
│   ├── sanitize-ai-input.ts
│   └── sanitize-ai-input.test.ts  # Unit tests alongside source
└── validation/
    ├── validate-themes.ts
    └── validate-themes.test.ts
```

### Integration Tests

Integration tests are located in `tests/integration/` and test realistic scenarios:

- Workflow script behavior with mocked GitHub API
- End-to-end security validation
- Cross-module interactions

Add integration tests for:

- New workflow scripts
- Changes to security modules
- New API endpoints or external integrations

## Pull Request Process

1. **Create a descriptive PR title**:
   - ✅ Good: "feat: add JSON schema validation for themes"
   - ❌ Bad: "update stuff"

2. **Ensure all CI checks pass**:
   - Security Tests (required)
   - Security Lint (required)
   - Coverage Ratchet (required)
   - Type checking
   - Linting

3. **Fill out the PR template** (if provided)

4. **Request review** from maintainers

5. **Address review comments** promptly

6. **Squash commits** before merging (if requested)

### Required CI Checks

The following checks must pass before merging:

- **Security Tests**: All security and validation tests must pass
- **Security Lint**: No hardcoded secrets or dangerous patterns
- **Coverage Ratchet**: Coverage must not decrease
- **Type Check**: No TypeScript errors
- **Lint**: Code must follow linting rules

### PR Labels

Maintainers will add labels to your PR:

- `security`: Touches security-sensitive code
- `tests`: Adds or modifies tests
- `documentation`: Updates documentation
- `bug`: Fixes a bug
- `enhancement`: Adds new feature

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Provide type annotations for public APIs
- Avoid `any` types (use `unknown` instead)

### Code Style

This project uses:

- **Prettier** for code formatting
- **ESLint** for linting
- **markdownlint** for markdown files

Format your code before committing:

```bash
bun run format
```

### Naming Conventions

- **Files**: kebab-case (`sanitize-ai-input.ts`)
- **Functions**: camelCase (`sanitizeInput()`)
- **Types/Interfaces**: PascalCase (`SecurityConfig`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Comments

- Use JSDoc for public functions
- Explain "why", not "what"
- Keep comments up-to-date with code

```typescript
/**
 * Sanitizes user input to prevent prompt injection attacks
 * @param input - Raw user input
 * @returns Sanitized input safe for AI prompts
 */
export function sanitizeInput(input: string): string {
  // Implementation
}
```

### Security Best Practices

When writing code that handles user input:

1. **Always sanitize** using `src/security/sanitize-ai-input.ts`
2. **Never trust user input** - validate everything
3. **Use allowlists** instead of denylists when possible
4. **Wrap user content** in XML tags for AI prompts
5. **Log injection attempts** for monitoring
6. **Test with malicious inputs** in your tests

Example:

```typescript
import { sanitizeForPrompt } from './security/sanitize-ai-input';

// ❌ BAD - Direct user input
const prompt = `Analyze this: ${userInput}`;

// ✅ GOOD - Sanitized input
const sanitized = sanitizeForPrompt(userInput);
const prompt = `Analyze this: <user_input>${sanitized}</user_input>`;
```

## Questions?

If you have questions about contributing:

1. Check existing [documentation](./docs/)
2. Search [existing issues](https://github.com/pantheon-org/awesome-opencode/issues)
3. Open a [new issue](https://github.com/pantheon-org/awesome-opencode/issues/new) for clarification

## License

By contributing, you agree that your contributions will be licensed under the [CC0-1.0 License](./LICENSE).
