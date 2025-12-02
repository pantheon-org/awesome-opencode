# Migration Guide: Workflow Architecture Refactoring

## Overview

The awesome-opencode codebase underwent a major architecture refactoring to improve maintainability, clarity, and separation of concerns. This refactoring reorganized the codebase into clear domain boundaries:

- **Domain Logic**: Categories, themes, tools, and tags are now under `src/domain/`
- **Workflow Infrastructure**: GitHub Actions have moved to `.github/actions/`
- **Reporting & Analysis**: Theme and security analysis utilities moved to `src/reporting/`
- **Security & Validation**: Centralized in `src/security/` and `src/validation/`
- **Utilities**: File I/O, markdown parsing, and logging now in dedicated modules

## ⚠️ Breaking Changes

### Import Path Changes

All import paths have changed. If you were using this package directly, you **must** update your imports.

### Old Files Removed

The following directories no longer exist:

- `src/bin/` - Moved to `.github/actions/` and `src/reporting/`
- `src/category/` - Moved to `src/domain/categories/`
- `src/theme/` - Moved to `src/domain/themes/`
- `src/tool/` - Moved to `src/domain/tools/`
- `src/tag/` - Moved to `src/domain/tags/`

## Import Migration Examples

### Categories

**Before:**

```typescript
import { loadCategories } from 'awesome-opencode/category';
import { getCategoryBySlug } from 'awesome-opencode/category';
```

**After:**

```typescript
import { loadCategories, getCategoryBySlug } from 'awesome-opencode/domain/categories';
// Or using barrel export
import { loadCategories, getCategoryBySlug } from 'awesome-opencode/domain';
```

### Themes

**Before:**

```typescript
import { getActiveThemes, discoverThemes } from 'awesome-opencode/theme';
```

**After:**

```typescript
import { getActiveThemes, discoverThemes } from 'awesome-opencode/domain/themes';
// Or using barrel export
import { getActiveThemes, discoverThemes } from 'awesome-opencode/domain';
```

### Tools

**Before:**

```typescript
import { getAllTools, getRelatedTools } from 'awesome-opencode/tool';
```

**After:**

```typescript
import { getAllTools, getRelatedTools } from 'awesome-opencode/domain/tools';
// Or using barrel export
import { getAllTools, getRelatedTools } from 'awesome-opencode/domain';
```

### Tags

**Before:**

```typescript
import { validateTag, normalizeTag } from 'awesome-opencode/tag';
import { getTagStats } from 'awesome-opencode/tag';
```

**After:**

```typescript
import { validateTag, normalizeTag, getTagStats } from 'awesome-opencode/domain/tags';
// Or using barrel export
import { validateTag, normalizeTag, getTagStats } from 'awesome-opencode/domain';
```

### Security & Validation

**Before:**

```typescript
// No public security module (internal use only)
```

**After:**

```typescript
import {
  sanitizeForPrompt,
  detectInjectionAttempt,
  validateThemes,
  validateCategories,
} from 'awesome-opencode/security';
```

### Reporting & Analysis

**Before:**

```typescript
// Previously scattered in src/bin/
import { analyzeThemes } from 'awesome-opencode/bin';
import { generateSecurityReport } from 'awesome-opencode/bin';
```

**After:**

```typescript
import { analyzeThemes, generateRecommendations } from 'awesome-opencode/reporting/theme-analysis';

import {
  generateSecurityReport,
  generateSecurityDashboard,
  analyzeSecurityHistory,
} from 'awesome-opencode/reporting/security-analysis';

// Or using barrel export
import { analyzeThemes, generateSecurityReport } from 'awesome-opencode/reporting';
```

## Step-by-Step Migration Instructions

### 1. Update Direct Imports

Find and replace old import paths with new ones:

```bash
# Find all old imports
grep -r "from ['\"]awesome-opencode/category" src/
grep -r "from ['\"]awesome-opencode/theme" src/
grep -r "from ['\"]awesome-opencode/tool" src/
grep -r "from ['\"]awesome-opencode/tag" src/
grep -r "from ['\"]awesome-opencode/bin" src/
```

### 2. Use the Main Export When Possible

Instead of importing from individual modules, use the main export:

**Before:**

```typescript
import { loadCategories } from 'awesome-opencode/category';
import { getActiveThemes } from 'awesome-opencode/theme';
import { validateTag } from 'awesome-opencode/tag';
```

**After:**

```typescript
import { loadCategories, getActiveThemes, validateTag } from 'awesome-opencode/domain';
```

Or use the top-level export:

```typescript
import awesome from 'awesome-opencode';
// awesome.loadCategories()
// awesome.getActiveThemes()
```

### 3. Update Relative Imports (Internal Use)

If you have internal code that imports from the package:

**Before:**

```typescript
import { loadCategories } from '../category';
import { validateTag } from '../tag';
```

**After:**

```typescript
import { loadCategories } from '../domain/categories';
import { validateTag } from '../domain/tags';
```

### 4. Update Package.json Scripts

If you have npm scripts calling old bin files:

**Before:**

```json
{
  "scripts": {
    "analyze": "bun run src/bin/analyze-themes.ts",
    "report": "bun run src/bin/generate-security-report.ts"
  }
}
```

**After:**

```json
{
  "scripts": {
    "analyze": "bun run src/reporting/theme-analysis/analyze-themes.ts",
    "report": "bun run src/reporting/security-analysis/generate-report.ts"
  }
}
```

## Common Migration Patterns

### Pattern 1: Importing Domain Logic

**Before:**

```typescript
import { loadCategories } from 'awesome-opencode/category';
import { getActiveThemes } from 'awesome-opencode/theme';
import { getAllTools } from 'awesome-opencode/tool';
import { validateTag } from 'awesome-opencode/tag';

function myFunction() {
  const categories = loadCategories();
  const themes = getActiveThemes();
  const tools = getAllTools();
}
```

**After:**

```typescript
import { loadCategories, getActiveThemes, getAllTools, validateTag } from 'awesome-opencode/domain';

function myFunction() {
  const categories = loadCategories();
  const themes = getActiveThemes();
  const tools = getAllTools();
}
```

### Pattern 2: Security & Validation

**Before:**

```typescript
// Security was internal only
```

**After:**

```typescript
import {
  sanitizeForPrompt,
  detectInjectionAttempt,
  validateCategories,
  validateThemes,
} from 'awesome-opencode/security';

const sanitized = sanitizeForPrompt(userInput);
const isValid = validateThemes(themeData);
```

### Pattern 3: Reporting & Analysis

**Before:**

```typescript
// Scattered across src/bin/
```

**After:**

```typescript
import {
  analyzeThemes,
  generateSecurityReport,
  generateSecurityDashboard,
} from 'awesome-opencode/reporting';

const report = await generateSecurityReport();
const analysis = analyzeThemes();
```

## FAQ

### Q: Can I use old import paths?

**A:** No. All old import paths have been removed. You must update to the new paths.

### Q: What if my code doesn't compile after updating imports?

**A:** Check that you're importing the correct function names. Some functions were renamed or reorganized. Refer to the specific module's exports in `src/domain/*/index.ts` or `src/reporting/*/index.ts`.

### Q: How do I know which module a function is exported from?

**A:** Check the main export in `src/index.ts` or look at the specific module's `index.ts`:

- Domain logic: `src/domain/*`
- Security: `src/security/index.ts`
- Validation: `src/validation/index.ts`
- Reporting: `src/reporting/*/index.ts`

### Q: Are there type changes?

**A:** Type names remain the same, but they're now exported from different modules. For example, `Theme` is still `Theme`, but you import it from `src/domain/themes` instead of `src/theme`.

### Q: What about internal GitHub Actions?

**A:** GitHub Actions have moved to `.github/actions/` and are now called via `uses:` in workflows. If you reference them internally, update references to use the `.github/actions/` path.

### Q: Is there a tool to automatically migrate my code?

**A:** No automatic migration tool is available yet. Migration is straightforward using find-and-replace:

```bash
# Find old imports
grep -r "from ['\"].*/(category|theme|tool|tag)" src/

# Replace category imports
sed -i "s|from '['\"]awesome-opencode/category|from 'awesome-opencode/domain/categories|g" src/**/*.ts

# Replace theme imports
sed -i "s|from '['\"]awesome-opencode/theme|from 'awesome-opencode/domain/themes|g" src/**/*.ts

# And so on...
```

### Q: What's the new recommended way to use this package?

**A:** Use the main export when possible:

```typescript
import * as awesome from 'awesome-opencode';
// or
import {
  loadCategories,
  getActiveThemes,
  validateThemes,
  generateSecurityReport,
} from 'awesome-opencode';
```

## Breaking Changes Summary

| Old Path                                 | New Path                              | Module    |
| ---------------------------------------- | ------------------------------------- | --------- |
| `src/category/`                          | `src/domain/categories/`              | Domain    |
| `src/theme/`                             | `src/domain/themes/`                  | Domain    |
| `src/tool/`                              | `src/domain/tools/`                   | Domain    |
| `src/tag/`                               | `src/domain/tags/`                    | Domain    |
| `src/bin/load-workflow-data.ts`          | `.github/actions/load-workflow-data/` | Actions   |
| `src/bin/format-prompt-data.ts`          | `.github/actions/format-prompt-data/` | Actions   |
| `src/bin/sync-readme.ts`                 | `.github/actions/sync-readme/`        | Actions   |
| `src/bin/validate-data.ts`               | `.github/actions/validate-data/`      | Actions   |
| `src/bin/analyze-themes.ts`              | `src/reporting/theme-analysis/`       | Reporting |
| `src/bin/generate-themes.ts`             | `src/domain/themes/`                  | Domain    |
| `src/bin/analyze-security-history.ts`    | `src/reporting/security-analysis/`    | Reporting |
| `src/bin/generate-security-dashboard.ts` | `src/reporting/security-analysis/`    | Reporting |
| `src/bin/generate-security-report.ts`    | `src/reporting/security-analysis/`    | Reporting |
| `src/bin/monitor-security.ts`            | `src/reporting/security-analysis/`    | Reporting |

## Getting Help

If you encounter issues during migration:

1. Check the [ARCHITECTURE.md](ARCHITECTURE.md) for detailed module documentation
2. Review the [specific module's index.ts](../src/index.ts) to see what's exported
3. Open an issue on GitHub with details about your specific use case
4. See [CONTRIBUTING.md](../CONTRIBUTING.md) for more information
