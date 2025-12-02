# Release Notes: v0.0.1 - Architecture Refactoring Release

**Release Date:** December 2, 2025

## 🎯 Major Changes

This release contains a comprehensive refactoring of the codebase to improve maintainability, clarity, and separation of concerns. The refactoring establishes clear domain boundaries and improves code organization.

### 🚨 Breaking Changes

**All import paths have changed.** This is a major breaking change. If you were using this package prior to v0.0.1, you **must** update your imports.

#### Old Import Paths (No Longer Valid)

```typescript
// ❌ DEPRECATED - No longer available
import { loadCategories } from 'awesome-opencode/category';
import { getActiveThemes } from 'awesome-opencode/theme';
import { getAllTools } from 'awesome-opencode/tool';
import { validateTag } from 'awesome-opencode/tag';
import { analyzeThemes } from 'awesome-opencode/bin';
```

#### New Import Paths (Use These)

```typescript
// ✅ NEW - Use these imports
import {
  loadCategories,
  getActiveThemes,
  getAllTools,
  validateTag,
  analyzeThemes,
} from 'awesome-opencode';

// Or import from specific modules
import { loadCategories } from 'awesome-opencode/domain/categories';
import { getActiveThemes } from 'awesome-opencode/domain/themes';
import { analyzeThemes } from 'awesome-opencode/reporting/theme-analysis';
```

**See [Migration Guide](docs/MIGRATION_GUIDE.md) for complete mapping of old→new paths.**

### 📁 New Architecture

```
src/
├── domain/           # Core business logic (categories, themes, tools, tags)
├── security/        # Prompt injection prevention and rate limiting
├── validation/      # JSON schema validation and data integrity checks
├── reporting/       # Analysis and reporting utilities
├── monitoring/      # Logging and metrics collection
└── io/              # File operations and data parsing

.github/actions/     # GitHub Actions for automated workflows
```

#### What Moved Where

| Category              | Old Location                             | New Location                          |
| --------------------- | ---------------------------------------- | ------------------------------------- |
| Categories            | `src/category/`                          | `src/domain/categories/`              |
| Themes                | `src/theme/`                             | `src/domain/themes/`                  |
| Tools                 | `src/tool/`                              | `src/domain/tools/`                   |
| Tags                  | `src/tag/`                               | `src/domain/tags/`                    |
| Workflow Data Loading | `src/bin/load-workflow-data.ts`          | `.github/actions/load-workflow-data/` |
| Prompt Formatting     | `src/bin/format-prompt-data.ts`          | `.github/actions/format-prompt-data/` |
| README Sync           | `src/bin/sync-readme.ts`                 | `.github/actions/sync-readme/`        |
| Data Validation       | `src/bin/validate-data.ts`               | `.github/actions/validate-data/`      |
| Theme Analysis        | `src/bin/analyze-themes.ts`              | `src/reporting/theme-analysis/`       |
| Security Analysis     | `src/bin/analyze-security-history.ts`    | `src/reporting/security-analysis/`    |
| Security Dashboard    | `src/bin/generate-security-dashboard.ts` | `src/reporting/security-analysis/`    |
| Security Reports      | `src/bin/generate-security-report.ts`    | `src/reporting/security-analysis/`    |

### ✨ New Features Unlocked by Refactoring

1. **Improved Module Organization**
   - Clear separation between domain logic, infrastructure, and utilities
   - Easier to find and maintain code
   - Better isolation of concerns

2. **Better Type Safety**
   - Centralized type definitions in each module
   - Improved IDE autocomplete
   - Clearer API boundaries

3. **Scalable Architecture**
   - New modules can be added without affecting existing code
   - Clear extension points for future features
   - Better support for monorepo patterns

4. **Security Module**
   - Consolidated prompt injection prevention
   - Unified rate limiting and alerting
   - Better security tracking and metrics

5. **Reporting Module**
   - Dedicated analysis and reporting utilities
   - Support for multiple output formats
   - Easier to extend with new analysis types

### 📚 Documentation

New and updated documentation:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed architecture overview (NEW)
- **[MIGRATION_GUIDE.md](docs/MIGRATION_GUIDE.md)** - Step-by-step migration instructions (NEW)
- **[WORKFLOW_ARCHITECTURE.md](docs/WORKFLOW_ARCHITECTURE.md)** - Refactoring phases and implementation details (UPDATED)
- **[README.md](README.md)** - Architecture section and migration notice (UPDATED)

### 🔄 Migration Path

To migrate your code:

1. **Quick Start:** See [Migration Guide](docs/MIGRATION_GUIDE.md) for import examples
2. **Find & Replace:** Update all old import paths to new paths
3. **Verify:** Run your tests to ensure everything works
4. **Deploy:** Update your package and enjoy the improved architecture

### ⚙️ Development Changes

#### Package.json Scripts Updated

```json
{
  "sync:readme": "bun run .github/actions/sync-readme/index.ts",
  "validate:data": "bun run .github/actions/validate-data/index.ts",
  "security:monitor": "bun run src/reporting/security-analysis/analyze-security-history.ts"
}
```

#### Removed Directories

The following directories have been completely removed:

- `src/bin/` - All files migrated to `.github/actions/` or `src/reporting/`
- Old import paths are no longer available

### 🧪 Testing

- All existing tests updated for new import paths
- Test coverage maintained at 99%+ for core modules
- Security module coverage: 96%+
- Reporting module coverage: 85%+

### 📋 Checklist for Migration

- [ ] Update all imports from old paths to new paths
- [ ] Update package.json scripts if you have any
- [ ] Run tests to verify everything works
- [ ] Update any documentation that references old paths
- [ ] Deploy updated code

### ⚠️ Deprecation Timeline

- **v0.0.1 (current):** Old import paths removed, migration guide available
- **Future versions:** May deprecate additional paths with notice

### 🐛 Bug Fixes

- Fixed import cycles by reorganizing modules
- Improved module resolution in TypeScript
- Better handling of circular dependencies

### 🚀 Performance

No significant performance changes. The refactoring maintains the same runtime behavior while improving code organization.

### 📖 Full Changelog

#### Breaking Changes (Phase 6)

- **Removed:** `src/bin/` directory and all files
- **Removed:** `src/category/` directory (moved to `src/domain/categories/`)
- **Removed:** `src/theme/` directory (moved to `src/domain/themes/`)
- **Removed:** `src/tool/` directory (moved to `src/domain/tools/`)
- **Removed:** `src/tag/` directory (moved to `src/domain/tags/`)
- **Changed:** All import paths - see Migration Guide
- **Updated:** `package.json` scripts

#### New Modules

- **`src/reporting/`** - Theme and security analysis utilities
- **`src/io/`** - Unified file operations, markdown parsing, JSON handling
- **`.github/actions/`** - GitHub Actions for workflow automation

#### Module Reorganization

- **`src/domain/`** - Consolidated categories, themes, tools, tags
- **`src/security/`** - Centralized prompt injection prevention
- **`src/validation/`** - Consolidated data validation
- **`src/monitoring/`** - Logging and metrics collection

### 🙏 Thanks

Thanks to all contributors who helped plan and implement this refactoring!

### 📞 Getting Help

- See [Migration Guide](docs/MIGRATION_GUIDE.md) for migration help
- Check [ARCHITECTURE.md](docs/ARCHITECTURE.md) for architecture details
- Open an issue on GitHub for bugs or questions

---

## Previous Releases

This is the first release of awesome-opencode. See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.
