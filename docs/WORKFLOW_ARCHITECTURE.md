# Workflow Architecture Migration Guide

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Phase 0 - Reference Document for Upcoming Migration

---

## Overview

This document describes the new workflow architecture being implemented through the 6-phase refactoring project. It provides a comprehensive guide for understanding the new structure, migrating existing code, and using the refactored modules.

---

## Table of Contents

1. [New Directory Structure](#new-directory-structure)
2. [Key Concepts](#key-concepts)
3. [Migration Path](#migration-path)
4. [Import Path Changes](#import-path-changes)
5. [Common Patterns](#common-patterns)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## New Directory Structure

### After Refactoring Complete

```
awesome-opencode/
│
├── src/
│   ├── domain/                    # Core business logic (NEW: renamed from category/, theme/, tool/, tag/)
│   │   ├── categories/            # (renamed from src/category/)
│   │   │   ├── load-categories.ts
│   │   │   ├── ensure-category-directory.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── themes/                # (renamed from src/theme/)
│   │   │   ├── load-themes.ts
│   │   │   ├── add-theme.ts
│   │   │   ├── get-themes.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── tools/                 # (renamed from src/tool/)
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── tags/                  # (renamed from src/tag/)
│   │   │   ├── get-tags/
│   │   │   ├── validate-tags/
│   │   │   ├── extract-tags.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── types.ts               # Shared domain types
│   │   └── index.ts               # Main exports
│   │
│   ├── security/                  # Security utilities (shared by all layers)
│   │   ├── sanitize-ai-input.ts   # Prompt injection prevention
│   │   ├── github-url.ts          # NEW: GitHub URL sanitization
│   │   ├── track-injections.ts    # Injection tracking
│   │   ├── alert.ts               # Security alerts
│   │   ├── rate-limit.ts          # Rate limiting
│   │   ├── safe-prompt-builder.ts # Safe prompt construction
│   │   ├── config.ts              # Security configuration
│   │   ├── types.ts               # Security types
│   │   ├── index.ts               # Consolidated exports
│   │   └── *.test.ts              # Tests (90%+ coverage required)
│   │
│   ├── validation/                # Data validation (shared by all layers)
│   │   ├── validate-categories.ts # Category schema validation
│   │   ├── validate-themes.ts     # Theme schema validation
│   │   ├── schema-utils.ts        # NEW: Shared schema utilities
│   │   ├── types.ts
│   │   ├── index.ts               # Consolidated exports
│   │   └── *.test.ts              # Tests (90%+ coverage required)
│   │
│   ├── reporting/                 # NEW: Report generation (moved from src/bin/)
│   │   ├── theme-analysis/        # Theme analysis reports
│   │   │   ├── analyze-themes.ts
│   │   │   ├── generate-recommendations.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── security-analysis/     # Security analysis reports
│   │   │   ├── analyze-security-history.ts
│   │   │   ├── generate-dashboard.ts
│   │   │   ├── generate-report.ts
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── types.ts
│   │   ├── index.ts               # Consolidated exports
│   │   └── *.test.ts              # Tests (85%+ coverage required)
│   │
│   ├── monitoring/                # Observability (already organized)
│   │   ├── logger.ts              # Logging utilities
│   │   ├── metrics.ts             # Metrics collection
│   │   ├── types.ts
│   │   ├── index.ts
│   │   └── *.test.ts
│   │
│   ├── io/                        # NEW: File I/O utilities
│   │   ├── file-operations.ts     # Read/write helpers
│   │   ├── markdown-parser.ts     # Frontmatter parsing
│   │   ├── json-handler.ts        # JSON utilities
│   │   ├── types.ts
│   │   ├── index.ts
│   │   └── *.test.ts              # Tests (85%+ coverage required)
│   │
│   ├── bin/                       # DEPRECATED: All moved or deleted
│   │   └── (empty after Phase 6)
│   │
│   └── index.ts                   # Main library exports
│
├── .github/
│   ├── workflows/                 # GitHub Actions workflows (unchanged)
│   │   ├── triage-submission.yml
│   │   ├── categorize-tool.yml
│   │   ├── validate-and-merge.yml
│   │   ├── security-tests.yml
│   │   └── ...
│   │
│   ├── actions/                   # NEW: Custom GitHub Actions
│   │   ├── load-workflow-data/
│   │   │   ├── action.yml
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── format-prompt-data/
│   │   │   ├── action.yml
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── sync-readme/
│   │   │   ├── action.yml
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── validate-data/
│   │   │   ├── action.yml
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── validate-github-url/
│   │   │   ├── action.yml
│   │   │   ├── index.ts
│   │   │   └── types.ts
│   │   │
│   │   └── triage-submission/     # Composite action
│   │       ├── action.yml
│   │       └── index.ts
│   │
│   ├── scripts/                   # GitHub Script utilities (TypeScript/ESM)
│   │   ├── common.ts              # NEW: Shared utilities
│   │   ├── github-api.ts          # NEW: GitHub API wrappers
│   │   ├── post-triage-comment.ts # (converted from CJS)
│   │   ├── post-validation-comment.ts
│   │   └── post-categorization-comment.ts
│   │
│   └── (no .cjs files - all converted)
│
├── scripts/                       # Local development scripts (unchanged)
│   ├── coverage-ratchet.ts
│   ├── fix-data.ts
│   └── pre-commit-validate-data.ts
│
├── docs/
│   ├── WORKFLOW_ARCHITECTURE.md   # This file
│   ├── ARCHITECTURE.md            # Updated
│   └── (other docs)
│
└── .context/
    ├── plan/
    │   └── workflow-refactoring-plan.md
    ├── BRANCH_STRATEGY.md
    ├── DEPENDENCY_MAP.md
    └── (other context files)
```

---

## Key Concepts

### The Three Layers

The refactored architecture separates concerns into three distinct layers:

#### 1. **Domain Layer** (`src/domain/`)

- Contains core business logic
- Independent of workflows
- Examples: categories, themes, tools, tags
- **Characteristics:** Pure business logic, no GitHub-specific code, reusable

#### 2. **Infrastructure Layer** (`src/security/`, `src/validation/`, `src/io/`, `src/monitoring/`)

- Shared utilities used by domain and workflow layers
- Provides cross-cutting concerns
- Examples: security, validation, file I/O
- **Characteristics:** Shared, generic, framework-agnostic

#### 3. **Workflow Layer** (`.github/actions/`, `.github/scripts/`)

- Orchestrates domain layer operations
- GitHub-specific implementations
- Examples: custom actions, workflow scripts
- **Characteristics:** Orchestration, GitHub-specific, event-driven

### Security Module Consolidation

**Before (Duplicated):**

```
src/security/sanitize-ai-input.ts     (116+ lines)
.github/scripts/post-triage-comment.cjs (25 lines of duplicate sanitization)
```

**After (Single Source of Truth):**

```
src/security/
├── sanitize-ai-input.ts     # Comprehensive sanitization
├── github-url.ts            # GitHub URL validation
├── index.ts                 # All exports in one place
└── (used by both src/ and .github/scripts/)
```

---

## Migration Path

### Phase-by-Phase Timeline

```
Phase 0 (Current)
├─ Documentation & branch strategy
└─ Dependency mapping

Phase 1 (Weeks 1-2)
├─ Extract GitHub URL validation
├─ Consolidate security exports
└─ Convert .github/scripts to TypeScript

Phase 2 (Weeks 2-3)
├─ Create .github/actions/ structure
├─ Implement custom actions
└─ Update workflows

Phase 3 (Weeks 3-4)
├─ Create src/reporting/ module
└─ Move analysis utilities

Phase 4 (Week 4)
├─ Create src/io/ module
├─ Implement file operations
└─ Update domain modules

Phase 5 (Weeks 4-5)
├─ Create src/domain/ folder
├─ Rename category/ → categories/
├─ Rename theme/ → themes/
├─ Rename tool/ → tools/
└─ Rename tag/ → tags/

Phase 6 (Week 5)
├─ Remove src/bin/
├─ Remove old CJS files
├─ Final documentation
└─ Release
```

---

## Import Path Changes

### Before → After (Summary)

| Layer         | Before                          | After                                 |
| ------------- | ------------------------------- | ------------------------------------- |
| Categories    | `src/category/`                 | `src/domain/categories/`              |
| Themes        | `src/theme/`                    | `src/domain/themes/`                  |
| Tools         | `src/tool/`                     | `src/domain/tools/`                   |
| Tags          | `src/tag/`                      | `src/domain/tags/`                    |
| Security      | `src/security/`                 | `src/security/` ✓ (no change)         |
| Validation    | `src/validation/`               | `src/validation/` ✓ (no change)       |
| Reporting     | `src/bin/analyze-*.ts`          | `src/reporting/*/`                    |
| File I/O      | (scattered)                     | `src/io/` ✓ (new)                     |
| Workflow Data | `src/bin/load-workflow-data.ts` | `.github/actions/load-workflow-data/` |

### Detailed Examples

#### Categories

**Before:**

```typescript
import { loadCategories } from 'src/category';
import { getCategoryBySlug } from 'src/category/get-category-by-slug';
```

**After:**

```typescript
import { loadCategories } from 'src/domain/categories';
import { getCategoryBySlug } from 'src/domain/categories/get-category-by-slug';
```

#### Themes

**Before:**

```typescript
import { loadThemes, addTheme } from 'src/theme';
import { getActiveThemes } from 'src/theme/get-themes';
```

**After:**

```typescript
import { loadThemes, addTheme } from 'src/domain/themes';
import { getActiveThemes } from 'src/domain/themes/get-themes';
```

#### Tags

**Before:**

```typescript
import { getAllUsedTags } from 'src/tag/get-tags';
import { validateTags } from 'src/tag/validate-tags';
```

**After:**

```typescript
import { getAllUsedTags } from 'src/domain/tags/get-tags';
import { validateTags } from 'src/domain/tags/validate-tags';
```

#### Reporting

**Before:**

```typescript
import { analyzeThemes } from 'src/bin/analyze-themes';
import { generateSecurityReport } from 'src/bin/generate-security-report';
```

**After:**

```typescript
import { analyzeThemes } from 'src/reporting/theme-analysis';
import { generateSecurityReport } from 'src/reporting/security-analysis';
```

#### Security (No Change)

```typescript
// Before and After (same)
import { sanitizeForPrompt } from 'src/security';
import { sanitizeGitHubUrl } from 'src/security'; // NEW function, same module
```

#### File I/O (New)

```typescript
// Before (scattered across modules)
import { readFileSync } from 'fs';

// After (centralized)
import { readFile, writeFile } from 'src/io/file-operations';
```

#### Workflow Actions (New)

**Before:**

```typescript
// Direct script calls
import { loadWorkflowData } from 'src/bin/load-workflow-data';

// Within workflow:
// run: bun run src/bin/load-workflow-data.ts
```

**After:**

```typescript
// GitHub Actions
// workflow.yml:
// uses: ./.github/actions/load-workflow-data

// Direct call (from scripts):
import { loadWorkflowData } from './.github/actions/load-workflow-data';
```

---

## Common Patterns

### Pattern 1: Using Security Module

**Prompt Sanitization:**

```typescript
import { sanitizeForPrompt } from 'src/security';

// In your function
const userInput = getUserInput();
const sanitized = sanitizeForPrompt(userInput);
const prompt = `Analyze: <input>${sanitized}</input>`;
```

**GitHub URL Validation:**

```typescript
import { sanitizeGitHubUrl } from 'src/security';

// Validate and get safe URL
const result = sanitizeGitHubUrl(urlFromUser);
if (result.isValid) {
  console.log('Safe URL:', result.url);
} else {
  console.error('Invalid URL:', result.reason);
}
```

### Pattern 2: Using Domain Modules

**Loading Data:**

```typescript
import { loadCategories } from 'src/domain/categories';
import { getActiveThemes } from 'src/domain/themes';

const categories = loadCategories();
const themes = getActiveThemes();

// Use data...
for (const theme of themes) {
  console.log(theme.name);
}
```

**Creating Data:**

```typescript
import { addTheme } from 'src/domain/themes';
import type { Theme } from 'src/domain/themes';

const newTheme: Theme = {
  id: 'my-theme',
  name: 'My Theme',
  // ... other properties
};

await addTheme(newTheme);
```

### Pattern 3: File I/O Operations

**Reading Files:**

```typescript
import { readFile } from 'src/io/file-operations';

const content = readFile('data/categories.json');
// Returns content as string, or throws if not found
```

**Writing Files:**

```typescript
import { writeFile } from 'src/io/file-operations';

const data = JSON.stringify({
  /* ... */
});
writeFile('output/data.json', data);
```

**Parsing Markdown:**

```typescript
import { parseMarkdown } from 'src/io/markdown-parser';

const markdown = readFile('docs/README.md');
const { frontmatter, content } = parseMarkdown(markdown);

console.log('Title:', frontmatter.title);
console.log('Content:', content);
```

### Pattern 4: GitHub Actions

**Using an Action in Workflow:**

```yaml
name: Triage Submission

on:
  issues:
    types: [opened]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Load workflow data using custom action
      - name: Load data
        id: load
        uses: ./.github/actions/load-workflow-data
        with:
          data-type: prompt

      # Use loaded data
      - name: Process
        run: echo "Prompt: ${{ steps.load.outputs.data }}"
```

**Implementing an Action:**

```typescript
// .github/actions/my-action/index.ts
import { loadThemes } from '../../src/domain/themes';

export async function execute(input: { theme_id: string }): Promise<string> {
  const themes = loadThemes();
  const theme = themes.find((t) => t.id === input.theme_id);

  if (!theme) {
    throw new Error(`Theme not found: ${input.theme_id}`);
  }

  return theme.name;
}
```

---

## Troubleshooting

### Issue 1: "Cannot find module 'src/category'"

**Cause:** Code still using old import paths

**Solution:**

```typescript
// ❌ Old
import { loadCategories } from 'src/category';

// ✅ New
import { loadCategories } from 'src/domain/categories';
```

**Prevention:** Update your imports during the migration phase your team is working on.

### Issue 2: "Duplicate security logic detected"

**Cause:** Code re-implementing security functions instead of using shared module

**Solution:**

```typescript
// ❌ Bad - reimplementing
function sanitizeUrl(url) {
  // Re-implementing URL validation...
}

// ✅ Good - using shared
import { sanitizeGitHubUrl } from 'src/security';
const result = sanitizeGitHubUrl(url);
```

### Issue 3: "GitHub URL validation in .github/scripts is different"

**Cause:** Old CJS scripts had weaker validation

**Solution:** After Phase 1, all scripts use the shared `src/security/github-url` module.

### Issue 4: "TypeError: Cannot read property 'xxx' of undefined"

**Cause:** Likely domain module not loading data correctly

**Solution:**

```typescript
import { loadThemes } from 'src/domain/themes';

// ❌ Wrong - themes is not a function
const theme = themes.get('id');

// ✅ Correct - themes is an array
const themes = loadThemes();
const theme = themes.find((t) => t.id === 'id');
```

### Issue 5: "Tests failing after migration"

**Cause:** Test imports not updated to match new paths

**Solution:**

```typescript
// Update test imports
import { loadCategories } from '../../../src/domain/categories';

// Or use relative imports if tests moved
import { loadCategories } from '../../domain/categories';
```

---

## FAQ

### Q: When do I need to update my code?

**A:** It depends on which phase your team is working on:

- **Phase 0-1:** Update security imports if you're in `src/security` or `.github/scripts`
- **Phase 2:** Update workflow-related code if using `src/bin/load-workflow-data.ts`
- **Phase 3:** Update reporting imports if using analysis utilities
- **Phase 4:** Update file I/O operations
- **Phase 5:** Update domain imports (categories, themes, tools, tags)
- **Phase 6:** Ensure `src/bin/` references are removed

### Q: Can I use old import paths?

**A:** **During the migration:** Yes, temporarily. Old paths remain until their phase completes.

**After migration:** No. Old paths will be deleted or deprecated.

**Best practice:** Always use new import paths as soon as your phase supports them.

### Q: What about external consumers of this library?

**A:** We maintain backward compatibility exports in `src/index.ts` during transition. After all 6 phases:

- Create a deprecation guide
- Provide migration steps
- Support legacy imports for one release cycle
- Remove in next major version

### Q: How do I know if code uses old or new patterns?

**A:** Look for these import patterns:

```typescript
// ❌ Old patterns (before migration)
import from 'src/category/';
import from 'src/theme/';
import from 'src/tool/';
import from 'src/tag/';
import from 'src/bin/';

// ✅ New patterns (after migration)
import from 'src/domain/categories/';
import from 'src/domain/themes/';
import from 'src/domain/tools/';
import from 'src/domain/tags/';
import from 'src/reporting/';
import from '.github/actions/';
```

### Q: What if I find code that doesn't match the pattern?

**A:**

1. Create an issue on the refactoring GitHub issue
2. Tag it with the phase number it belongs to
3. Provide file path and line number
4. Assign to phase lead

### Q: Can I parallel work on multiple phases?

**A:** **No.** Phases must be done sequentially because each phase depends on previous ones. However, you can:

- Prepare documentation for Phase N+1 while Phase N is in review
- Set up test cases for Phase N+1 while Phase N is in review
- Do NO code changes until previous phase is merged

### Q: What if a phase breaks something?

**A:**

1. The phase branch should have caught it in testing
2. If it gets to `main`, we have rollback procedures
3. A revert PR will be created
4. The phase lead will analyze the root cause
5. Fixes will be added and re-submitted

### Q: How long will the migration take?

**A:** ~6 weeks total:

- Phase 0: 2 days
- Phase 1: 1 week
- Phase 2: 1.5 weeks
- Phase 3: 1 week
- Phase 4: 1 week
- Phase 5: 3 days
- Phase 6: 2 days

### Q: Do I need to do anything right now (Phase 0)?

**A:** If you're a reviewer or maintainer:

1. Read this document
2. Read `.context/plan/workflow-refactoring-plan.md`
3. Review Phase 0 PR
4. Approve or provide feedback

If you're a developer:

1. Familiarize yourself with new structure
2. Prepare your code for migration (Phase 5 will affect you)
3. Watch for your phase announcement

### Q: Where do I ask for help?

**A:**

1. Check this document's troubleshooting section
2. Check `.context/plan/workflow-refactoring-plan.md` for phase details
3. Comment on GitHub issue
4. Ask phase lead directly
5. Open a discussion thread

---

## Related Documents

- **Full Plan:** [.context/plan/workflow-refactoring-plan.md](.context/plan/workflow-refactoring-plan.md)
- **Branch Strategy:** [.context/BRANCH_STRATEGY.md](.context/BRANCH_STRATEGY.md)
- **Dependency Map:** [.context/DEPENDENCY_MAP.md](.context/DEPENDENCY_MAP.md)
- **Current Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Reference Document - Phase 0  
**Next Review:** After Phase 1 Completion
