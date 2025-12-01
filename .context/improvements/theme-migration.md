# Theme Migration Guide

## Overview

This guide provides step-by-step instructions for migrating existing tools to the new theme-based categorization system. The migration process is designed to be non-breaking, allowing gradual adoption while maintaining backward compatibility.

## Migration Timeline

The migration follows a phased rollout approach:

### Phase 1: Foundation (Week 1-2)

- ✅ Create `data/themes.json` with seed themes
- ✅ Implement theme management utilities
- ✅ Create tag management system
- ✅ Build theme discovery script

### Phase 2: Analysis (Week 3)

- Run theme discovery on existing tools
- Review discovered themes
- Approve high-confidence themes
- Document theme guidelines

### Phase 3: Tool Migration (Week 4-6)

- Update tool frontmatter with themes
- Add tags to existing tools
- Validate tool metadata
- Test theme queries

### Phase 4: Integration (Week 7-8)

- Update categorization workflow
- Integrate theme suggestions in PR process
- Update README with theme navigation
- Add theme-based search

## Backward Compatibility

The system maintains full backward compatibility:

- **Categories remain primary**: Directory structure unchanged
- **Existing tools work as-is**: Tools without themes still valid
- **Graceful degradation**: Missing theme data doesn't break functionality
- **Progressive enhancement**: Tools gain theme features incrementally

## Migration Steps

### Step 1: Install Dependencies

No new dependencies required. Ensure you have:

```bash
bun --version  # Should be 1.0.0 or higher
```

### Step 2: Run Theme Discovery

Analyze existing tools to identify potential themes:

```bash
bun run analyze:themes --output themes-report.json
```

Review the generated report to understand:

- Current tool distribution
- Suggested themes based on tag clustering
- Tag usage statistics
- Tools needing theme assignment

### Step 3: Review and Approve Themes

1. Open `themes-report.json`
2. Review high-confidence theme candidates
3. For each theme candidate:
   - Verify the theme makes conceptual sense
   - Check tools are appropriately grouped
   - Ensure keywords are relevant
   - Confirm category mappings

4. Add approved themes to `data/themes.json`:

```json
{
  "id": "new-theme-id",
  "name": "New Theme Name",
  "description": "Clear description of theme purpose",
  "keywords": ["keyword1", "keyword2"],
  "categories": ["category1", "category2"],
  "status": "active",
  "metadata": {
    "auto_discovered": true,
    "tool_count": 5,
    "created_date": "2025-11-24",
    "approved_by": "manual"
  }
}
```

### Step 4: Update Tool Frontmatter

For each tool, add theme and tag information:

#### Before

```markdown
---
tool_name: 'Example Tool'
category: ai-coding-assistants
repository: https://github.com/example/tool
---
```

#### After

```markdown
---
tool_name: 'Example Tool'
category: ai-coding-assistants
themes:
  primary: ai-powered-development
  secondary:
    - developer-productivity
tags:
  - ai
  - code-generation
  - vscode
  - typescript
repository: https://github.com/example/tool
---
```

### Step 5: Validate Migration

Run validation to ensure all tools have proper metadata:

```bash
# Type check
bun run typecheck

# Run theme analysis again to verify counts
bun run analyze:themes
```

## Migration Checklist

Use this checklist for each tool:

- [ ] Tool has `category` field (required, unchanged)
- [ ] Tool has `themes.primary` field (new, required)
- [ ] Tool has 0-2 secondary themes if applicable
- [ ] Tool has at least 3 relevant tags
- [ ] Tags are normalized (lowercase, hyphenated)
- [ ] Tags validated against suggested list
- [ ] Theme assignment makes conceptual sense
- [ ] Tool still accessible via category directory

## Bulk Migration Script

For migrating multiple tools at once, create a migration script:

```typescript
import { getAllTools } from './src/tags.js';
import { getActiveThemes } from './src/themes.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Example: Assign themes based on category
const assignThemesByCategory = () => {
  const tools = getAllTools();
  const themes = getActiveThemes();

  for (const tool of tools) {
    // Skip if already has primary theme
    if (tool.themes?.primary) continue;

    // Find appropriate theme based on category
    const matchingTheme = themes.find((theme) => theme.categories.includes(tool.category));

    if (matchingTheme) {
      // Read tool file
      const filePath = join(
        process.cwd(),
        'docs',
        tool.category,
        `${tool.tool_name.toLowerCase().replace(/\s+/g, '-')}.md`,
      );

      // Update frontmatter (implementation needed)
      // writeFileSync(filePath, updatedContent);
    }
  }
};
```

## Common Migration Patterns

### Pattern 1: AI-Powered Tools

Tools with AI capabilities:

```yaml
category: ai-coding-assistants
themes:
  primary: ai-powered-development
tags:
  - ai
  - code-generation
  - machine-learning
```

### Pattern 2: Testing Tools

Tools focused on testing:

```yaml
category: testing-tools
themes:
  primary: code-quality-security
  secondary:
    - developer-productivity
tags:
  - testing
  - automation
  - ci-cd
```

### Pattern 3: IDE Extensions

Editor extensions and plugins:

```yaml
category: ide-extensions
themes:
  primary: developer-productivity
tags:
  - vscode
  - intellij
  - editor
```

### Pattern 4: Multi-Faceted Tools

Tools spanning multiple themes:

```yaml
category: code-analysis-quality
themes:
  primary: code-quality-security
  secondary:
    - ai-powered-development
tags:
  - security
  - static-analysis
  - ai
  - vulnerability-scanning
```

## Tag Assignment Guidelines

### Essential Tags

Every tool should have tags for:

1. **Platform/Environment**: `cli`, `web`, `vscode`, `intellij`
2. **Primary Language**: `python`, `typescript`, `javascript`, `go`
3. **Core Function**: `testing`, `linting`, `debugging`, `documentation`
4. **Key Features**: `ai`, `automation`, `security`, `performance`

### Tag Selection Process

1. Review tool README and documentation
2. Check GitHub repository topics
3. Identify primary use cases
4. Add 3-10 most relevant tags
5. Validate against suggested tags
6. Normalize tag format

### Tag Examples by Category

**AI Coding Assistants**:

```yaml
tags: [ai, code-completion, code-generation, vscode, multi-language]
```

**Code Analysis & Quality**:

```yaml
tags: [linting, static-analysis, security, code-review, ci-cd]
```

**Development Automation**:

```yaml
tags: [automation, workflow, ci-cd, git, deployment]
```

**Documentation Tools**:

```yaml
tags: [documentation, api-docs, markdown, code-comments]
```

**Testing Tools**:

```yaml
tags: [testing, unit-testing, integration-testing, automation, ci-cd]
```

**IDE Extensions**:

```yaml
tags: [vscode, intellij, editor, productivity, shortcuts]
```

## Validation Checkpoints

### Checkpoint 1: Theme Coverage

Run analysis to verify theme coverage:

```bash
bun run analyze:themes
```

Expected results:

- ✅ 80%+ tools have primary theme assigned
- ✅ Active themes have 3+ tools each
- ✅ No themes marked "under_review" without reason

### Checkpoint 2: Tag Consistency

Check tag normalization:

```typescript
import { getAllUsedTags, validateTags } from './src/tags.js';

const usedTags = getAllUsedTags();
const results = validateTags(usedTags);

// Filter for suggestions
const needsReview = results.filter((r) => r.suggestion);
console.log('Tags needing review:', needsReview);
```

### Checkpoint 3: Data Integrity

Verify all required fields present:

```bash
# Check for tools missing themes
grep -r "^category:" docs/ | while read line; do
  file=$(echo $line | cut -d: -f1)
  if ! grep -q "^themes:" "$file"; then
    echo "Missing themes: $file"
  fi
done
```

## Rollback Plan

If issues arise during migration:

### 1. Immediate Rollback

- Theme data is additive (doesn't remove category data)
- Remove theme and tag fields from tool frontmatter
- System falls back to category-only mode
- No functionality loss

### 2. Partial Rollback

- Keep themes but disable theme-based features
- Update workflows to ignore theme data
- Tools remain valid with category only

### 3. Data Preservation

- All theme data stored in `data/themes.json`
- Tool frontmatter backed up before migration
- Git history preserves previous state

## Troubleshooting

### Issue: Tools Not Appearing in Theme Queries

**Cause**: Missing or incorrect theme assignment

**Solution**:

1. Verify tool has `themes.primary` field
2. Check theme ID matches theme in `data/themes.json`
3. Ensure theme status is "active"

### Issue: Tag Validation Warnings

**Cause**: Tags not in suggested list

**Solution**:

1. Check for typos in tag names
2. Normalize tag format
3. Add commonly used tags to suggested list
4. Merge duplicate tags

### Issue: Theme Count Mismatch

**Cause**: Tool count not updated after changes

**Solution**:

```bash
# Re-run analysis to update counts
bun run analyze:themes
```

### Issue: Frontmatter Parsing Errors

**Cause**: Invalid YAML syntax in frontmatter

**Solution**:

1. Validate YAML syntax
2. Check proper indentation (2 spaces)
3. Ensure arrays use consistent format
4. Quote strings with special characters

## Post-Migration Tasks

After migration is complete:

1. **Update Documentation**
   - Add theme sections to README
   - Update contribution guidelines
   - Document theme assignment process

2. **Update Workflows**
   - Modify categorization workflow
   - Add theme suggestions to PR template
   - Enable theme-based automation

3. **Monitor Health**
   - Track theme tool counts
   - Review theme relevance quarterly
   - Merge similar themes as needed

4. **Gather Feedback**
   - Survey tool submitters
   - Monitor theme usage patterns
   - Iterate on theme definitions

## Additional Resources

- [Theme Discovery Documentation](./THEME-DISCOVERY.md)
- [Project Architecture](./ARCHITECTURE.md)
- [API Reference](./THEME-DISCOVERY.md#api-reference)

## Support

For questions or issues during migration:

- Open a GitHub issue
- Tag with `migration` label
- Include specific tool or theme details
- Provide error messages if applicable
