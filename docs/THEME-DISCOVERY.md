# Theme Discovery System

## Overview

The Awesome OpenCode project uses a dynamic theme-based categorization system to organize and discover tools. This system combines fixed categories for file structure with flexible themes for conceptual grouping and granular tags for multi-dimensional filtering.

## Organizational Hierarchy

The system uses three layers of organization:

```text
Themes (1-3 per tool, one primary)
  ↓ Conceptual groupings spanning multiple categories
  ↓ Examples: "AI-Powered Development", "Developer Productivity"
  ↓
Categories (1 per tool, determines directory structure)
  ↓ Fixed organizational buckets for file system
  ↓ Examples: "ai-coding-assistants", "testing-tools"
  ↓
Tags (unlimited, granular descriptors)
  ↓ Multi-dimensional metadata for filtering
  ↓ Examples: "cli", "python", "vscode", "security"
```

### Relationship Rules

- **Themes → Categories**: One theme can span multiple categories (many-to-many)
- **Tools → Themes**: One tool can have 1-3 themes, one marked primary (many-to-many, constrained)
- **Tools → Category**: One tool has exactly one category (one-to-many)
- **Tools → Tags**: One tool can have unlimited tags (many-to-many)

## Theme Discovery Algorithm

### 1. Automated Discovery Process

The theme discovery system uses tag clustering analysis to identify potential themes:

1. **Tag Analysis**: Scan all tools and collect tag usage statistics
2. **Clustering**: Group tools by popular tags (appearing in 3+ tools)
3. **Co-occurrence Detection**: Identify tags that frequently appear together
4. **Category Mapping**: Determine which categories are represented in each cluster
5. **Confidence Scoring**: Calculate confidence based on:
   - Number of tools (more tools = higher confidence)
   - Keyword coherence (related tags appearing together)
   - Category span (themes spanning multiple categories are more valuable)

### 2. Confidence Calculation

```typescript
function calculateConfidence(tools, keywords, categories) {
  let confidence = 0;

  // Base confidence on number of tools
  if (tools.length >= 5) confidence += 0.4;
  else if (tools.length >= 3) confidence += 0.3;
  else confidence += 0.15;

  // Add confidence for keyword coherence
  if (keywords.length >= 3) confidence += 0.2;
  else if (keywords.length >= 2) confidence += 0.1;

  // Add confidence for category span
  if (categories.length >= 2) confidence += 0.2;
  else if (categories.length === 1) confidence += 0.1;

  return Math.min(confidence, 1.0);
}
```

### 3. Theme Creation Criteria

A theme candidate must meet these requirements:

- **Minimum Tools**: At least 3 tools must share the theme
- **Confidence Threshold**: Confidence score >= 0.6 for automatic suggestion
- **Manual Approval**: All auto-discovered themes require manual review before activation
- **Coherence**: Keywords must be semantically related
- **Distinctiveness**: Theme must not overlap significantly with existing themes

## Theme Lifecycle Management

### Active Themes

- Themes with `status: "active"` appear in navigation and discovery features
- Must maintain minimum 3 tools to remain active
- Tool counts updated automatically during analysis

### Under Review

Themes enter review status when:

- Auto-discovered but not yet approved
- Tool count drops below 3
- Manual review requested

Review process:

1. Theme gets `status: "under_review"`
2. `review_date` set to current_date + 30 days
3. GitHub issue created for maintainer review
4. After review period, maintainers choose:
   - **Keep**: Maintain as active theme
   - **Merge**: Combine into broader theme
   - **Archive**: Remove from active use but preserve data
   - **Delete**: Remove completely

### Archived Themes

- Themes with `status: "archived"` are hidden from UI
- Historical data preserved for analysis
- Can be reactivated if tool count increases

## Running Theme Discovery

### Basic Usage

```bash
bun run analyze:themes
```

This will:

- Scan all tools in `docs/` directories
- Analyze tag patterns and clustering
- Display existing themes with tool counts
- Suggest new high-confidence theme candidates
- Show tag statistics

### With Output File

```bash
bun run analyze:themes --output themes-report.json
```

Generates a detailed JSON report with:

- Discovered themes with confidence scores
- Tool associations for each theme
- Tag statistics and usage patterns
- Recommendations for theme management

## Theme Configuration

### data/themes.json Structure

```json
{
  "themes": [
    {
      "id": "ai-powered-development",
      "name": "AI-Powered Development",
      "description": "Tools leveraging AI for coding workflows",
      "keywords": ["ai", "ml", "code-generation", "autocomplete"],
      "categories": ["ai-coding-assistants", "code-analysis-quality"],
      "status": "active",
      "metadata": {
        "auto_discovered": false,
        "tool_count": 12,
        "created_date": "2025-11-24",
        "approved_by": "manual"
      }
    }
  ],
  "suggested_tags": ["ai", "cli", "testing", "..."],
  "seed_themes": ["ai-powered-development", "developer-productivity"]
}
```

## Tag Management

### Tag Normalization

All tags are automatically normalized to ensure consistency:

- Convert to lowercase
- Replace spaces and underscores with hyphens
- Remove non-alphanumeric characters (except hyphens)
- Remove leading/trailing hyphens

Examples:

- `Code Generation` → `code-generation`
- `VS_Code` → `vs-code`
- `Python3.11` → `python311`

### Tag Validation

When adding tags, the system:

1. Normalizes the tag
2. Checks against suggested tags list
3. Finds close matches using Levenshtein distance (≤ 2)
4. Suggests alternatives if similar tags exist

Example:

```typescript
validateTag('typscript', suggestedTags);
// Returns: { valid: true, normalized: 'typscript', suggestion: 'typescript' }
```

### Suggested Tags

The `suggested_tags` list in `data/themes.json` provides guidance without enforcing strict vocabulary:

- New tags are allowed if they pass normalization
- System suggests existing tags for close matches
- Popular tags automatically added to suggestions
- Periodic review process merges similar tags

## Tool Metadata Format

Tools should include theme and tag information in their frontmatter:

```markdown
---
tool_name: 'GitHub Copilot'
category: ai-coding-assistants
themes:
  primary: ai-powered-development
  secondary:
    - developer-productivity
tags:
  - ai
  - code-completion
  - vscode
  - multi-language
repository: https://github.com/features/copilot
---
```

## Best Practices

### Creating Themes

1. **Start Broad**: Begin with high-level conceptual themes
2. **Avoid Over-Segmentation**: Don't create themes for every tag
3. **Focus on User Intent**: Themes should match how users think about tools
4. **Cross-Category Themes**: Themes spanning multiple categories are most valuable
5. **Clear Descriptions**: Write descriptions that explain the theme's purpose

### Assigning Themes

1. **Primary Theme First**: Choose the most representative theme
2. **Limit Secondary Themes**: Use 0-2 secondary themes maximum
3. **Consider User Journey**: Assign themes users would search for
4. **Check Existing Tools**: Look at similar tools for consistency

### Managing Tags

1. **Use Suggested Tags**: Check suggested list before adding new tags
2. **Be Specific**: Prefer specific tags over generic ones
3. **Avoid Redundancy**: Don't duplicate theme/category information in tags
4. **Think Searchability**: Add tags users would filter by

## API Reference

See `src/themes.ts` for theme management functions:

- `loadThemes()`: Load theme configuration
- `getActiveThemes()`: Get all active themes
- `addTheme()`: Add new theme with approval workflow
- `updateThemeToolCount()`: Update tool count and handle review status
- `reviewTheme()`: Process theme review decision

See `src/tags.ts` for tag management utilities:

- `normalizeTag()`: Normalize tag to standard format
- `validateTag()`: Validate and suggest alternatives
- `getAllUsedTags()`: Get all tags currently in use
- `getRelatedTools()`: Find tools sharing tags

## Examples

### Example 1: High-Confidence Theme Discovery

```text
AI-Powered Development (confidence: 0.92)
  └─ 12 tools: github-copilot, cursor, tabnine, codeium, ...
  └─ Keywords: ai, ml, code-generation, autocomplete
  └─ Suggested categories: ai-coding-assistants, code-analysis-quality
```

### Example 2: Cross-Category Theme

```text
Developer Productivity (confidence: 0.85)
  └─ 8 tools across 3 categories
  └─ Categories: development-automation, ide-extensions, testing-tools
  └─ Keywords: automation, workflow, efficiency, shortcuts
```

### Example 3: Theme Under Review

```json
{
  "id": "api-development",
  "name": "API Development",
  "status": "under_review",
  "metadata": {
    "tool_count": 2,
    "review_date": "2025-12-24",
    "review_issue": "https://github.com/.../issues/123"
  }
}
```

## Troubleshooting

### Low Confidence Scores

If discovered themes have low confidence:

- Check if tools have sufficient tags
- Verify tag coherence and relevance
- Consider if theme is too narrow or too broad
- Review if tools truly share conceptual similarities

### Theme Overlap

If themes overlap significantly:

- Review keyword sets for distinctiveness
- Consider merging similar themes
- Refine theme descriptions for clarity
- Adjust category associations

### Missing Themes

If tools don't fit existing themes:

- Run theme discovery to identify gaps
- Create custom theme with manual approval
- Ensure tool metadata includes relevant tags
- Consider if new theme meets minimum tool count

## Additional Resources

- [Theme Migration Guide](./THEME-MIGRATION.md)
- [Project Architecture](./ARCHITECTURE.md)
- [Contribution Guidelines](../README.md)
