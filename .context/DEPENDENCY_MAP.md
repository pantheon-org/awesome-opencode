# Dependency Map & Analysis

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Phase 0 - Dependency Analysis Complete

---

## Executive Summary

This document maps all cross-module dependencies and identifies the complexity of the refactoring effort. The analysis reveals:

- **10 files in `src/bin/`** that orchestrate workflows
- **3 npm scripts** that directly call bin files
- **3 GitHub workflows** that use bin utilities
- **4 CJS scripts** in `.github/scripts/` with duplicated security logic
- **22 domain files** with external dependencies

---

## Table of Contents

1. [Dependency Graph](#dependency-graph)
2. [Module Dependencies](#module-dependencies)
3. [File-by-File Analysis](#file-by-file-analysis)
4. [Impact Assessment](#impact-assessment)
5. [Migration Order](#migration-order)
6. [Risk Analysis](#risk-analysis)

---

## Dependency Graph

### High-Level Architecture Dependencies

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Workflows                       │
│   .github/workflows/*.yml                               │
└──────────────────┬──────────────────────────────────────┘
                   │ calls
        ┌──────────▼──────────┐
        │ .github/scripts/    │
        │ (CJS files)         │
        └──┬────────────┬─────┘
           │ uses       │ uses
    ┌──────▼──┐    ┌────▼──────────────┐
    │src/bin/ │    │ Duplicated        │
    │(TS)     │    │ Sanitization Code │
    └──┬──────┘    └───────────────────┘
       │ uses
    ┌──┴─────────────────────────┐
    │  src/domain/               │
    │  src/security/             │
    │  src/validation/           │
    │  src/monitoring/           │
    └────────────────────────────┘
```

### After Refactoring

```
┌─────────────────────────────────────────────────────────┐
│                  GitHub Workflows                       │
│   .github/workflows/*.yml                               │
└──────────────────┬──────────────────────────────────────┘
                   │ calls
        ┌──────────▼──────────────────┐
        │ .github/actions/            │
        │ (Custom GitHub Actions)     │
        └──┬───────────────┬──────────┘
           │ uses          │ uses
        ┌──▼──────────┐  ┌─▼──────────────────┐
        │src/domain/  │  │src/security/       │
        │src/io/      │  │(shared by all)     │
        │(business    │  │src/validation/     │
        │logic)       │  │(shared by all)     │
        └─────────────┘  └────────────────────┘

.github/scripts/ → TypeScript/ESM using security module
```

---

## Module Dependencies

### src/bin/ Module Breakdown

| File | Purpose | Dependencies | Type |
|------|---------|--------------|------|
| `load-workflow-data.ts` | Load categories/themes for prompts | validation, category, theme | Workflow |
| `format-prompt-data.ts` | Format data for AI prompts | security, monitoring | Workflow |
| `validate-data.ts` | Validate data files | validation | Workflow |
| `sync-readme.ts` | Sync README based on state | category, theme, monitoring | Workflow |
| `analyze-themes.ts` | Generate theme analysis | theme, tag, reporting | Analysis |
| `generate-themes.ts` | Generate theme recommendations | theme, generate-report | Analysis |
| `analyze-security-history.ts` | Analyze security events | security, monitoring | Analysis |
| `generate-security-dashboard.ts` | Generate security dashboard | security, monitoring | Analysis |
| `generate-security-report.ts` | Generate security report | security, monitoring | Analysis |
| `monitor-security.ts` | Monitor security events | security, monitoring | Analysis |

**Summary:**
- 4 Workflow orchestration files (load, format, validate, sync)
- 6 Analysis/reporting files

### Security Module Dependencies

**Location:** `src/security/`

**Files:**
- `sanitize-ai-input.ts` - Prompt injection prevention (116+ lines)
- `track-injections.ts` - Track injection attempts
- `alert.ts` - Security alerts
- `rate-limit.ts` - Rate limiting
- `safe-prompt-builder.ts` - Safe prompt construction
- `config.ts` - Configuration
- `types.ts` - Type definitions

**Used By:**
- ✅ `src/validation/` - Injection detection
- ✅ `src/monitoring/` - Metrics tracking
- ✅ `src/bin/analyze-security-history.ts`
- ✅ `src/bin/generate-security-dashboard.ts`
- ✅ `src/bin/generate-security-report.ts`
- ✅ `src/bin/monitor-security.ts`
- ❌ `.github/scripts/post-*.cjs` - **DUPLICATED** (weak sanitization)

**Issue:** GitHub scripts have weaker versions of security logic

---

## File-by-File Analysis

### 1. src/bin/load-workflow-data.ts

```typescript
// Current Usage
import { validateCategoriesFile, validateThemesFile } from '../validation';

// Direct External Use
// - Called from: .github/workflows/triage-submission.yml
// - Called from: npm script "sync:readme"
```

**Workflow References:**
```yaml
# .github/workflows/triage-submission.yml
- name: Load prompt template
  run: bun run src/bin/load-workflow-data.ts load-prompt
```

**Migration:** Move to `.github/actions/load-workflow-data/` (Phase 2)

---

### 2. src/bin/format-prompt-data.ts

```typescript
// Current Usage
import { sanitizeForPrompt } from '../security';

// Used in: Workflow execution
// Not directly called elsewhere
```

**Migration:** Move to `.github/actions/format-prompt-data/` (Phase 2)

---

### 3. src/bin/validate-data.ts

```typescript
// Current Usage
import { validateCategoriesFile, validateThemesFile } from '../validation';

// Direct External Use
// - npm script "validate:data"
// - Pre-commit hook

// Workflow References
// .github/workflows/categorize-tool.yml
```

**Migration:** Move to `.github/actions/validate-data/` (Phase 2)

---

### 4. src/bin/sync-readme.ts

```typescript
// Current Usage
import { loadCategories } from '../category';
import { getActiveThemes } from '../theme';

// Direct External Use
// - npm script "sync:readme"

// Post-merge workflow
```

**Migration:** Move to `.github/actions/sync-readme/` (Phase 2)

---

### 5. src/bin/analyze-themes.ts

```typescript
// Current Usage
import { getActiveThemes } from '../theme';
import { getAllTools } from '../tool';

// Direct External Use
// - npm script "analyze:themes"
```

**Migration:** Move to `src/reporting/theme-analysis/` (Phase 3)

---

### 6. src/bin/generate-themes.ts

```typescript
// Current Usage
import { getThemesUnderReview } from '../theme/get-themes';

// Direct External Use
// - npm script "generate:themes"
```

**Migration:** Move to `src/reporting/theme-analysis/` (Phase 3)

---

### 7-10. Security Analysis Files

```typescript
// src/bin/analyze-security-history.ts
// src/bin/generate-security-dashboard.ts
// src/bin/generate-security-report.ts
// src/bin/monitor-security.ts

// Direct External Use
// - npm scripts (security:*)
// - .github/workflows/security-report.yml
```

**Migration:** Move to `src/reporting/security-analysis/` (Phase 3)

---

### .github/scripts/ - CJS Duplication Issue

#### Problem Code

**File:** `.github/scripts/post-triage-comment.cjs`

```javascript
// ❌ DUPLICATED: Weak version of sanitization logic
function sanitizeGitHubUrl(url) {
  // 25 lines of partially duplicated URL sanitization
  // Weaker than src/security/sanitize-ai-input.ts (116+ lines)
}
```

**Root Cause:** CJS files can't import TypeScript utilities

**Solution (Phase 1):**
1. Extract GitHub URL validation: `src/security/github-url.ts`
2. Convert CJS to TypeScript: `.github/scripts/post-triage-comment.ts`
3. Import from shared security module

---

## Module Dependency Matrix

### Dependencies by Module

```
src/bin/
├── load-workflow-data.ts
│   ├── src/validation/ ✓
│   ├── src/category/ (→ domain/categories in Phase 5)
│   └── src/theme/ (→ domain/themes in Phase 5)
│
├── format-prompt-data.ts
│   └── src/security/ ✓
│
├── validate-data.ts
│   └── src/validation/ ✓
│
├── sync-readme.ts
│   ├── src/category/ (→ domain/categories in Phase 5)
│   └── src/theme/ (→ domain/themes in Phase 5)
│
├── analyze-themes.ts
│   ├── src/theme/ (→ domain/themes in Phase 5)
│   ├── src/tag/ (→ domain/tags in Phase 5)
│   └── src/tool/ (→ domain/tools in Phase 5)
│
├── generate-themes.ts
│   ├── src/theme/ (→ domain/themes in Phase 5)
│   └── src/generate-report/ (→ reporting in Phase 3)
│
└── analyze-security-history.ts, generate-security-dashboard.ts, etc.
    ├── src/security/ ✓
    └── src/monitoring/ ✓
```

### Reverse Dependencies (What imports from src/bin/)

```
Nothing currently imports from src/bin/
↑ All calls are direct script execution
  (npm scripts, workflows, pre-commit hooks)
```

**Impact:** Can safely move `src/bin/` files without breaking imports (only script calls)

### Reverse Dependencies (What uses security module)

```
src/security/ is imported by:
├── src/validation/ - Detection
├── src/monitoring/ - Metrics
├── src/bin/ files - Analysis and reporting
└── .github/scripts/ ❌ DUPLICATED (cJS limitation)
```

---

## Impact Assessment

### Phase 1 Impact: Extract Security

**Files Affected:** 5

```
src/security/ (modified)
├── sanitize-ai-input.ts (refactored)
├── github-url.ts (NEW) ← Extracted from .github/scripts/
├── index.ts (exports updated)
└── ...

.github/scripts/ (converted CJS → TS)
├── post-triage-comment.ts (uses shared github-url)
├── post-categorization-comment.ts (uses shared security)
└── post-validation-comment.ts (uses shared security)
```

**Dependency Changes:** ✅ Positive (removes duplication)

---

### Phase 2 Impact: GitHub Actions

**Files Affected:** 10 (5 new, 5 moved)

```
.github/actions/ (NEW)
├── load-workflow-data/
├── format-prompt-data/
├── sync-readme/
├── validate-data/
└── validate-github-url/

src/bin/ (referenced by new actions, still exist)
```

**Workflow Changes:** 3 workflows updated to use new actions

**Dependency Changes:** ✅ Positive (cleaner separation)

---

### Phase 3 Impact: Reporting Module

**Files Affected:** 6

```
src/reporting/ (NEW)
├── theme-analysis/
│   └── (moved from src/bin/analyze-themes.ts, etc.)
└── security-analysis/
    └── (moved from src/bin/generate-security-dashboard.ts, etc.)

src/bin/ (6 files moved)
```

**npm Script Changes:** 6 scripts updated

**Dependency Changes:** ✅ Positive (better organization)

---

### Phase 4 Impact: I/O Module

**Files Affected:** 8+

```
src/io/ (NEW)
├── file-operations.ts
├── markdown-parser.ts
└── json-handler.ts

src/domain/ modules (refactored to use I/O)
├── category/
├── theme/
├── tool/
└── tag/
```

**Dependency Changes:** ✅ Neutral (refactoring only)

---

### Phase 5 Impact: Rename Domain

**Files Affected:** 30+

```
src/domain/ (NEW structure)
├── categories/ (from src/category/)
├── themes/ (from src/theme/)
├── tools/ (from src/tool/)
└── tags/ (from src/tag/)

ALL IMPORTS UPDATED (entire codebase)
```

**Biggest change:** All domain imports updated
- Domain files: ~20
- Bin files: 10 (before deleted in Phase 6)
- Test files: ~50

**Dependency Changes:** ⚠️ Major (widespread, but mechanical)

---

### Phase 6 Impact: Cleanup

**Files Affected:** 11+

```
src/bin/ DELETED (10 files)
.github/scripts/*.cjs DELETED (3 files)
```

**Dependency Changes:** ✅ Final cleanup

---

## Migration Order

### Correct Sequence (Dependencies First)

```
Phase 0: Documentation & Planning ✓
         ↓
Phase 1: Extract Security
         (phase-1-extract-security branch)
         - Create src/security/github-url.ts
         - Convert .github/scripts to TypeScript
         - No import path changes
         ↓
Phase 2: GitHub Actions
         (phase-2-github-actions branch)
         - Create .github/actions/*
         - Update workflows
         - No import path changes
         ↓
Phase 3: Reporting Module
         (phase-3-reporting-module branch)
         - Create src/reporting/*
         - Move analysis files
         - Update npm scripts
         ↓
Phase 4: I/O Module
         (phase-4-io-module branch)
         - Create src/io/*
         - Refactor domain modules
         ↓
Phase 5: Rename Domain
         (phase-5-rename-domain branch)
         - Create src/domain/
         - Rename all subdirectories
         - Update 70+ import paths
         ↓
Phase 6: Cleanup
         (phase-6-cleanup-deprecation branch)
         - Delete src/bin/
         - Delete .github/scripts/*.cjs
         - Final verification
```

### Why This Order?

1. **Phase 1 First:** Security is foundational, used by everything
2. **Phase 2 Second:** Workflows become cleaner/independent
3. **Phase 3 Third:** Reporting doesn't block other work
4. **Phase 4 Fourth:** I/O is utility layer
5. **Phase 5 Fifth:** Domain rename is last (widespread impact)
6. **Phase 6 Last:** Only cleanup after everything moved

---

## Risk Analysis

### High Risk: Phase 5 (Rename Domain)

**Risk:** 70+ import path changes across codebase

**Mitigation:**
- Use automated search-replace
- Create test for each old/new path pair
- Run full test suite after automation
- Manual review of high-impact files

**Files to Monitor:**
- All test files (50+)
- All src/ files (50+)
- All .github/actions/ files (new)

---

### Medium Risk: Phase 2 (GitHub Actions)

**Risk:** Workflow changes could break submissions

**Mitigation:**
- Test each action individually first
- Test workflows in PR check
- Keep old implementation temporarily
- Monitor first real submissions after merge

**Files to Monitor:**
- 3 workflow YAML files
- All new action files

---

### Medium Risk: Phase 1 (Security)

**Risk:** Security logic changes could miss injections

**Mitigation:**
- Keep old logic during testing
- Run both old/new in parallel temporarily
- Comprehensive test coverage
- Security review before merge

**Files to Monitor:**
- All sanitization tests
- All CJS conversion changes

---

### Low Risk: Phase 3 & 4

**Risk:** Minimal (reporting doesn't affect core workflows)

**Mitigation:**
- Standard review process
- Full test coverage

---

## Cross-Phase Dependencies

### If Phase N Fails

```
Phase 0 fails → Cannot proceed (blocker)
Phase 1 fails → Can retry, Phase 2+ delayed
Phase 2 fails → Can retry, Phase 3+ delayed
Phase 3 fails → Can retry, Phase 4+ delayed
Phase 4 fails → Can retry, Phase 5 delayed
Phase 5 fails → Can retry, Phase 6 delayed
Phase 6 fails → Cleanup retry only
```

### Parallel Work Possible?

**No.** Phases must be sequential due to dependencies:
- Phase 1 consolidates security used by Phase 2+
- Phase 2 uses domain modules renamed in Phase 5
- Phase 5 updates imports used everywhere

**However:**
- Can prepare documentation for Phase N+1
- Can draft PR templates for Phase N+1
- Can review Phase N+1 code without merging

---

## Dependency Summary Table

| Module | Current Status | Phase Changed | New Location | Breaking |
|--------|---|---|---|---|
| src/category/ | Active | Phase 5 | src/domain/categories/ | ✅ Yes |
| src/theme/ | Active | Phase 5 | src/domain/themes/ | ✅ Yes |
| src/tool/ | Active | Phase 5 | src/domain/tools/ | ✅ Yes |
| src/tag/ | Active | Phase 5 | src/domain/tags/ | ✅ Yes |
| src/bin/ | Active | Phase 2-3 & 6 | .github/actions/ & src/reporting/ | ✅ Yes |
| src/security/ | Active | Phase 1 | src/security/ (enhanced) | ❌ No |
| src/validation/ | Active | None | src/validation/ (unchanged) | ❌ No |
| src/monitoring/ | Active | None | src/monitoring/ (unchanged) | ❌ No |
| .github/scripts/ | Active (CJS) | Phase 1 & 6 | .github/scripts/ (converted to TS) & deleted | ✅ Yes |
| .github/actions/ | Missing | Phase 2 | .github/actions/ (new) | N/A |
| src/io/ | Missing | Phase 4 | src/io/ (new) | N/A |
| src/reporting/ | Missing | Phase 3 | src/reporting/ (new) | N/A |
| src/domain/ | Missing | Phase 5 | src/domain/ (new) | N/A |

---

## Testing Impact by Phase

| Phase | New Tests Required | Modified Tests | Deleted Tests |
|-------|---|---|---|
| Phase 1 | Security module tests (github-url) | CJS conversion tests | None |
| Phase 2 | 5 action tests | Workflow tests | None |
| Phase 3 | Reporting module tests | Bin file tests | None |
| Phase 4 | I/O module tests | Domain module tests | None |
| Phase 5 | None | 70+ import path updates | None |
| Phase 6 | None | Verify cleanup | Bin/CJS tests (deprecated) |

---

## Related Documents

- **Full Refactoring Plan:** [.context/plan/workflow-refactoring-plan.md](.context/plan/workflow-refactoring-plan.md)
- **Branch Strategy:** [.context/BRANCH_STRATEGY.md](.context/BRANCH_STRATEGY.md)
- **Architecture Guide:** [docs/WORKFLOW_ARCHITECTURE.md](docs/WORKFLOW_ARCHITECTURE.md)

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Phase 0 - Analysis Complete  
**Next Review:** Phase 1 Kickoff
