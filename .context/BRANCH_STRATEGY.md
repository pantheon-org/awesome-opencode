# Branch Strategy for Workflow Architecture Refactoring

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Phase 0 - Active

---

## Overview

This document outlines the branch strategy for the 6-phase workflow architecture refactoring project. The strategy ensures organized, reviewable, and reversible changes across the codebase.

---

## Branch Naming Convention

### Naming Pattern

```
<type>/<scope>-<description>

Examples:
- feat/phase-0-preparation
- feat/phase-1-extract-security
- feat/phase-2-github-actions
```

### Branch Types

| Type | Purpose | Examples |
|------|---------|----------|
| `feat/` | New features or refactoring work | `feat/phase-1-extract-security` |
| `fix/` | Bug fixes related to refactoring | `fix/import-path-regression` |
| `docs/` | Documentation updates | `docs/update-architecture-guide` |
| `test/` | Test additions or updates | `test/add-security-module-tests` |
| `chore/` | Maintenance tasks | `chore/update-gitignore` |

---

## Main Work Branches

### Primary Branch Structure

```
main (production-ready)
 └── feat/workflow-architecture-refactoring (main work branch)
      ├── feat/phase-0-preparation
      ├── feat/phase-1-extract-security
      ├── feat/phase-2-github-actions
      ├── feat/phase-3-reporting-module
      ├── feat/phase-4-io-module
      ├── feat/phase-5-rename-domain
      └── feat/phase-6-cleanup-deprecation
```

### Branch Hierarchy

1. **Main Branch (`main`)**
   - Production-ready code
   - All tests passing
   - Comprehensive documentation
   - Stable state

2. **Primary Work Branch (`feat/workflow-architecture-refactoring`)**
   - Integration point for all phases
   - Parent branch for phase-specific branches
   - Created AFTER Phase 0 completes
   - Merged back to `main` after all 6 phases complete

3. **Phase-Specific Branches (`feat/phase-N-*`)**
   - One branch per phase
   - Created from `feat/workflow-architecture-refactoring`
   - Contain all work for that specific phase
   - Merged to primary work branch upon phase completion

---

## Phase 0: Preparation (Current)

### Branch: `feat/phase-0-preparation`

**Starting Point:** `main`  
**Destination:** Create PR to `main`

**Work Items:**

1. Create `.context/BRANCH_STRATEGY.md` (this file)
2. Create `docs/WORKFLOW_ARCHITECTURE.md`
3. Create `.context/DEPENDENCY_MAP.md`
4. Create GitHub issue with full refactoring plan

**Deliverables:**
- Branch strategy documentation
- Architecture migration guide
- Dependency mapping and analysis
- GitHub issue linking to plan document

**PR Strategy:** Single PR to `main` with all Phase 0 documentation

---

## Phase 1: Extract & Consolidate Security

### Branch: `feat/phase-1-extract-security`

**Starting Point:** `feat/workflow-architecture-refactoring` (after Phase 0 merge)  
**Destination:** `feat/workflow-architecture-refactoring`

**Work Items:**

1. Extract GitHub URL sanitization to `src/security/github-url.ts`
2. Consolidate security exports in `src/security/index.ts`
3. Convert `.github/scripts/*.cjs` to TypeScript
4. Update imports across codebase
5. Add comprehensive tests

**Test Gates:**
- All security tests pass
- Coverage >= 96%
- No TypeScript errors
- All workflows functional

**PR Strategy:** Single comprehensive PR with:
- New security module
- Converted scripts
- Updated tests
- Performance verification

---

## Phase 2: Create GitHub Actions Layer

### Branch: `feat/phase-2-github-actions`

**Starting Point:** `feat/workflow-architecture-refactoring` (after Phase 1 merge)  
**Destination:** `feat/workflow-architecture-refactoring`

**Sub-branches (Optional):**
```
feat/phase-2-github-actions
 ├── feat/phase-2a-load-workflow-data
 ├── feat/phase-2b-format-prompt-data
 ├── feat/phase-2c-sync-readme
 ├── feat/phase-2d-validate-data
 ├── feat/phase-2e-validate-github-url
 └── feat/phase-2f-composite-actions
```

**Work Items:**

1. Create `.github/actions/` directory structure
2. Implement individual actions
3. Create composite actions
4. Update workflow YAML files
5. Test all workflows

**Test Gates:**
- All action tests pass
- All workflows execute successfully
- No regression in existing functionality
- Coverage >= 80%

**PR Strategy:** Can use either:
- Single comprehensive PR, OR
- Multiple focused PRs (one per action type)

---

## Phase 3: Create Reporting Module

### Branch: `feat/phase-3-reporting-module`

**Starting Point:** `feat/workflow-architecture-refactoring` (after Phase 2 merge)  
**Destination:** `feat/workflow-architecture-refactoring`

**Work Items:**

1. Create `src/reporting/` directory structure
2. Move theme analysis utilities
3. Move security analysis utilities
4. Create type definitions
5. Update package.json scripts
6. Add comprehensive tests

**Test Gates:**
- All reporting module tests pass
- Coverage >= 85%
- No imports of deprecated paths

**PR Strategy:** Single PR with:
- New reporting module structure
- Moved utilities with tests
- Updated npm scripts
- Documentation updates

---

## Phase 4: Create I/O Module

### Branch: `feat/phase-4-io-module`

**Starting Point:** `feat/workflow-architecture-refactoring` (after Phase 3 merge)  
**Destination:** `feat/workflow-architecture-refactoring`

**Work Items:**

1. Create `src/io/` module
2. Implement file operations
3. Implement markdown parser
4. Implement JSON handler
5. Refactor domain modules to use I/O utilities
6. Add comprehensive tests

**Test Gates:**
- All I/O module tests pass
- Coverage >= 85%
- All domain modules still functional

**PR Strategy:** Single PR with:
- New I/O module
- Domain module refactoring
- Tests for all operations

---

## Phase 5: Rename Domain Modules

### Branch: `feat/phase-5-rename-domain`

**Starting Point:** `feat/workflow-architecture-refactoring` (after Phase 4 merge)  
**Destination:** `feat/workflow-architecture-refactoring`

**Work Items:**

1. Create `src/domain/` folder structure
2. Move `category/` → `domain/categories`
3. Move `theme/` → `domain/themes`
4. Move `tool/` → `domain/tools`
5. Move `tag/` → `domain/tags`
6. Update all imports automatically
7. Update tests
8. Update documentation

**Test Gates:**
- All tests pass
- Coverage maintained at previous levels
- No broken imports

**PR Strategy:** Single PR with:
- Renamed modules and structure
- Updated imports
- Test updates
- Documentation updates

---

## Phase 6: Cleanup & Deprecation

### Branch: `feat/phase-6-cleanup-deprecation`

**Starting Point:** `feat/workflow-architecture-refactoring` (after Phase 5 merge)  
**Destination:** `feat/workflow-architecture-refactoring`

**Work Items:**

1. Remove `src/bin/` directory
2. Remove old CJS script files
3. Update `src/index.ts` with new exports
4. Final documentation updates
5. Create migration guide
6. Prepare release notes

**Test Gates:**
- All tests pass
- Coverage maintained
- No references to old paths remain

**PR Strategy:** Single PR with:
- Removed deprecated files
- Updated exports
- Final documentation
- Release notes

**Post-Merge:** Merge to `main` and prepare release

---

## Merge Strategy

### Within Phase Work

```
feat/phase-N-* (phase branch)
    ↓ (1-3 reviews required)
feat/workflow-architecture-refactoring (main work branch)
```

### Phase 0 Special Case

```
feat/phase-0-preparation (no main work branch yet)
    ↓ (2 reviews required)
main (goes directly to main)
    ↓ (after Phase 0 approval)
feat/workflow-architecture-refactoring (main work branch created)
```

### Final Merge

```
feat/workflow-architecture-refactoring (all 6 phases complete)
    ↓ (final review + team approval)
main (production merge)
```

---

## Commit Message Convention

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Examples

```
feat(phase-0): add branch strategy documentation

- Add comprehensive branch naming conventions
- Document main work branch structure
- Outline merge strategy for all phases

Related-To: #123 (GitHub issue)
```

```
refactor(security): extract github url validation

- Extract GitHub URL sanitization to dedicated module
- Add comprehensive test coverage
- Update import paths in related modules

Related-To: Phase 1 - Extract Security
```

### Scope Examples

- `phase-0`, `phase-1`, etc. for phase-specific work
- `security`, `github-actions`, `reporting`, `io`, `domain` for module-specific work
- `workflow` for workflow-related changes
- `docs` for documentation updates
- `test` for test additions

### Body Guidelines

- Explain WHY, not WHAT
- Reference related files/modules
- Call out breaking changes
- Include related issues/PRs
- Explain any non-obvious design decisions

---

## Code Review Requirements

### Phase 0 (Documentation)
- ✅ 2 reviewers
- ✅ All checks pass
- ✅ Documentation is clear and comprehensive

### Phases 1-6 (Implementation)
- ✅ 2 reviewers (1 architect, 1 developer)
- ✅ All tests pass
- ✅ Coverage >= target for module
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ Security implications reviewed (for Phase 1)
- ✅ Workflow functionality verified (for Phase 2)

---

## Conflict Resolution

### When Phases Conflict

If two phases create conflicting changes:

1. **Identify** the conflict (Git will flag)
2. **Communicate** with both phase leads
3. **Coordinate** merge order with:
   - Phase with fewer changes merges first
   - Or Phase with lower risk merges first
4. **Rebase** dependent phase branch
5. **Re-test** dependent phase
6. **Proceed** with merges in agreed order

### If Main is Updated During Phase Work

1. **Check** main changes for impact
2. **Rebase** phase branch on updated main (if Phase 0)
3. **Merge** main into phase branch (if Phase 1+)
4. **Re-test** phase functionality
5. **Resolve** any conflicts
6. **Push** updated branch

---

## Long-Running Branches

### Branch Synchronization

For phase branches active > 2 weeks:

1. Sync weekly from parent branch
2. Run full test suite after sync
3. Report any new conflicts
4. Fix test failures immediately
5. Keep branch reasonably up-to-date

### Rebase vs Merge

- **Use Rebase** for keeping phase branches clean
- **Use Merge** for integrating completed phases
- **Document** any non-standard approaches

---

## Cleanup & Archival

### After Phase Completion

1. Delete local feature branch: `git branch -d feat/phase-N-*`
2. Delete remote branch: `git push origin --delete feat/phase-N-*`
3. Archive branch info in `.context/PHASE_COMPLETIONS.md`

### After Full Refactoring Complete

1. Tag final commit: `git tag -a v2.0.0-refactored-architecture`
2. Create release notes
3. Close GitHub issue
4. Delete `feat/workflow-architecture-refactoring`

---

## Rollback Procedure

### If Phase Fails

1. **Identify** failure (tests, security, functionality)
2. **Document** the issue
3. **Revert** to last stable commit
4. **Analyze** root cause
5. **Plan** fixes
6. **Re-attempt** phase with mitigations

### Command Reference

```bash
# Revert entire phase branch
git revert --no-edit $(git merge-base main feat/phase-N-*)..HEAD

# Restore from backup (if committed to main)
git revert <commit-hash>

# Check what changed in phase
git diff main..feat/phase-N-*

# List all commits in phase
git log main..feat/phase-N-*
```

---

## Quick Reference

### Creating a Phase Branch

```bash
# Switch to main work branch
git checkout feat/workflow-architecture-refactoring

# Create phase branch
git checkout -b feat/phase-N-<description>

# Push to remote
git push -u origin feat/phase-N-<description>
```

### Submitting Phase Work

```bash
# Commit your work
git add .
git commit -m "feat(phase-N): your commit message"

# Push to remote
git push

# Create PR
gh pr create --title "Phase N: Your Title" --body "..."
```

### Merging Completed Phase

```bash
# Switch to parent branch
git checkout feat/workflow-architecture-refactoring

# Update parent
git pull origin feat/workflow-architecture-refactoring

# Merge phase branch
git merge --no-ff feat/phase-N-<description>

# Push merged result
git push origin feat/workflow-architecture-refactoring
```

---

## Status Tracking

Current branch status:

| Phase | Branch | Status | PRs | Notes |
|-------|--------|--------|-----|-------|
| 0 | feat/phase-0-preparation | 🟡 Active | [PR#XXX](TBD) | Documentation phase |
| 1 | feat/phase-1-extract-security | 🔴 Pending | - | Waiting for Phase 0 |
| 2 | feat/phase-2-github-actions | 🔴 Pending | - | Waiting for Phase 1 |
| 3 | feat/phase-3-reporting-module | 🔴 Pending | - | Waiting for Phase 2 |
| 4 | feat/phase-4-io-module | 🔴 Pending | - | Waiting for Phase 3 |
| 5 | feat/phase-5-rename-domain | 🔴 Pending | - | Waiting for Phase 4 |
| 6 | feat/phase-6-cleanup-deprecation | 🔴 Pending | - | Waiting for Phase 5 |

**Legend:** 🟡 = Active | 🔴 = Pending | 🟢 = Complete

---

## Questions?

For questions about the branch strategy:
1. Review this document
2. Check `.context/plan/workflow-refactoring-plan.md`
3. Open an issue with the `question` label
4. Discuss with phase lead

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Created By:** OpenCode Workflow Refactoring Initiative  
**Status:** Ready for Implementation
