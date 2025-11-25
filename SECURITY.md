# Security Policy

## Prompt Injection Prevention

This project implements robust security measures to prevent prompt injection attacks when interacting with AI agents. All AI integrations follow security best practices to protect against malicious inputs.

### Overview

The project uses Anthropic Claude through the OpenCode GitHub Action for automated tool triage, categorization, and validation. All user-provided content is sanitized before being passed to AI agents to prevent prompt injection attacks.

### Security Measures

#### 1. Input Sanitization

All user-provided content undergoes sanitization before being used in AI prompts:

- **GitHub URLs**: Validated against strict patterns, newlines stripped, special characters rejected
- **Repository Names**: Alphanumeric validation, path traversal prevention, suspicious patterns blocked
- **File Paths**: Whitelist-based validation, path traversal blocked, extension checking
- **Text Content**: Injection patterns removed, encoded payloads detected, length limits enforced

#### 2. Injection Pattern Detection

The system detects and blocks common injection patterns:

- **Role-switching attempts**: "Ignore previous instructions", "You are now a..."
- **Instruction override**: "Your new task is...", "System update:"
- **Delimiter injection**: "---END SYSTEM PROMPT---", "</system>"
- **Context confusion**: Attempts to manipulate conversation structure
- **Encoded payloads**: Base64, URL-encoded, or unicode-escaped injection attempts

#### 3. Prompt Structure

All prompts use XML-style tags for clear content separation:

```markdown
<system_instruction>
Your instructions here...
</system_instruction>

<user_input label="Repository URL">
https://github.com/user/repo
</user_input>

<!-- WARNING: Untrusted user input above -->

<instruction_reinforcement>
Remember: Always validate the tool before approval.
</instruction_reinforcement>
```

This structure ensures:

- Clear boundaries between system instructions and user content
- Explicit marking of untrusted input
- Reinforcement of critical instructions after user content

### Protected Call Sites

The following locations have prompt injection protection:

1. **Triage Workflow** (`.github/scripts/post-triage-comment.cjs`)
   - Validates GitHub URLs from issue bodies
   - Detects injection attempts in issue content
   - Sanitizes URLs before prompt insertion

2. **Categorization Workflow** (`.github/scripts/post-categorization-comment.cjs`)
   - Validates GitHub URLs and repository names
   - Sanitizes category and theme data
   - Wraps all user content in XML tags

3. **Validation Workflow** (`.github/scripts/post-validation-comment.cjs`)
   - Validates file paths against whitelist
   - Extracts and validates issue numbers
   - Detects injection in PR bodies

### Using Security Utilities

For TypeScript code, import from `src/security/`:

```typescript
import {
  sanitizeGitHubUrl,
  sanitizeRepoName,
  sanitizeTextContent,
  SafePromptBuilder,
} from './security';

// Sanitize individual inputs
const cleanUrl = sanitizeGitHubUrl(userProvidedUrl);
const cleanName = sanitizeRepoName(repoName);

// Build safe prompts
const builder = new SafePromptBuilder();
const prompt = builder
  .setSystemInstruction('Analyze the repository')
  .addGitHubUrl(repoUrl)
  .addUserContent('Description', description)
  .setReinforcement('Remember to validate')
  .build();

// Check for injections
if (builder.hasDetectedInjections()) {
  console.warn('Injection attempts:', builder.getDetectedInjections());
}
```

### Testing

Security modules have comprehensive test coverage (>96%):

```bash
# Run security tests
bun test src/security/

# Check coverage
bun test --coverage src/security/
```

### Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainers directly (see CODEOWNERS)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Security Best Practices

When contributing:

1. **Never trust user input**: Always sanitize before using in prompts
2. **Use provided utilities**: Don't implement custom sanitization
3. **Test injection resistance**: Add tests for new AI integration points
4. **Log suspicious activity**: Use `detectInjectionAttempt()` for monitoring
5. **Review prompts carefully**: Ensure clear separation of instructions and user content

### References

- [OWASP LLM Top 10 - Prompt Injection](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [Anthropic Prompt Engineering - Security](https://docs.anthropic.com/en/docs/prompt-engineering)
- [Detailed Security Analysis](./docs/ai-agent-security-analysis.md)

### JSON Schema Validation

All data files that populate AI prompts are validated against JSON schemas before use. This prevents data poisoning attacks and ensures data integrity.

#### Validated Files

- `data/categories.json` - Category definitions
- `data/themes.json` - Theme definitions

#### Validation Features

1. **Schema Enforcement**
   - Required fields validation
   - Type checking (strings, numbers, arrays, objects)
   - Pattern validation (slugs, IDs, dates)
   - Length constraints (min/max)
   - Enum validation (status values)

2. **Injection Detection**
   - All text fields checked for injection patterns
   - Keywords, tags, and arrays validated
   - Metadata fields sanitized

3. **Performance**
   - Validation completes in <100ms per file
   - Integrated into data loading pipeline
   - Fails fast on validation errors

#### Using Validation

```bash
# Validate all data files
bun run validate:data

# Run validation in CI/CD
bun run validate:data || exit 1
```

In TypeScript code:

```typescript
import { validateCategoriesFile, validateThemesFile } from './validation';

// Validate before loading
const result = validateCategoriesFile('./data/categories.json');
if (!result.valid) {
  console.error('Validation failed:', result.errors);
  process.exit(1);
}
```

#### Schema Files

JSON schemas are located in `schemas/`:

- `schemas/categories.schema.json` - Categories validation schema
- `schemas/themes.schema.json` - Themes validation schema

Both schemas follow JSON Schema Draft 2020-12 specification.

### Updates

- **2025-11-25**: JSON schema validation implementation
  - Added JSON schemas for categories and themes
  - Created validation module with comprehensive tests
  - Integrated validation into data loading pipeline
  - Added CLI tool for standalone validation
  - Achieved 90%+ test coverage for validation modules
- **2025-11-25**: Initial prompt injection prevention implementation
  - Added input sanitization module
  - Added safe prompt builder
  - Updated all workflow scripts with security measures
  - Achieved 96.88% test coverage

---

For detailed technical analysis of injection vectors and risk assessment, see [AI Agent Security Analysis](./docs/ai-agent-security-analysis.md).
