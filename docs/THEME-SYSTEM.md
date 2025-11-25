# Theme System Implementation

## Overview

The Awesome OpenCode project uses a dynamic, AI-driven theme system that allows tools to be organized by their conceptual purpose in addition to their technical category.

## Architecture

### Three-Layer Organization

```
Themes (1-3 per tool)
  ↓ Conceptual/philosophical groupings
  ↓ Examples: "AI-Powered Development", "Developer Productivity"
  ↓
Categories (1 per tool, required)
  ↓ Fixed organizational buckets
  ↓ Determines directory structure
  ↓ Examples: "ai-coding-assistants", "testing-tools"
  ↓
Tags (unlimited per tool)
  ↓ Granular technical descriptors
  ↓ Examples: "cli", "python", "vscode", "security"
```

### Directory Structure

```
docs/
  ├── tools/              # All tool documentation (flat structure)
  │   ├── tool-name.md
  │   └── ...
  └── themes/             # Auto-generated theme pages
      ├── ai-powered-development.md
      ├── developer-productivity.md
      └── code-quality-security.md
```

## How It Works

### 1. Tool Submission Flow

When a tool is submitted:

1. **OpenCode Analysis**: The AI analyzes the tool and suggests:
   - 1 category (required)
   - 1-3 themes (at least one, max three)
   - Relevant tags
2. **Theme Handling**:
   - **Existing theme**: Use theme ID
   - **New theme**: OpenCode creates theme with:
     - Descriptive ID (e.g., `api-testing`)
     - Clear name (e.g., "API Testing")
     - Description (what tools in this theme do)
     - 3-5 keywords
3. **Auto-Add to data/themes.json**:
   - New themes added with `status: "pending-review"`
   - Includes metadata: creation date, tool count, auto-discovery flag

4. **Theme Page Generation**:
   - Create or update `docs/themes/{theme-id}.md`
   - List all tools in the theme
   - Show related themes
   - Display keywords

5. **PR Creation**:
   - Tool doc at `docs/tools/{tool}.md`
   - Updated `data/themes.json` (if new themes)
   - Updated/created theme pages
   - Label: `automated` (and `new-themes` if applicable)

6. **Validation & Merge**:
   - OpenCode validates the tool doc
   - Activates pending themes (`pending-review` → `active`)
   - Updates README.md
   - Merges PR and closes issue

### 2. Theme Lifecycle

```
┌─────────────────┐
│   New Theme     │
│  (AI suggests)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ pending-review  │
│ (in themes.json)│
└────────┬────────┘
         │
         │ PR merged
         ▼
┌─────────────────┐
│     active      │
│  (public theme) │
└────────┬────────┘
         │
         │ If tools < 3
         ▼
┌─────────────────┐
│  under_review   │
│  (30-day grace) │
└────────┬────────┘
         │
         ├─→ Keep (→ active)
         ├─→ Archive (→ archived)
         └─→ Delete (removed)
```

### 3. Tool Frontmatter Format

```yaml
---
tool_name: 'GitHub Copilot'
repository: 'https://github.com/features/copilot'
category: 'ai-coding-assistants'
themes:
  - ai-powered-development
  - developer-productivity
tags:
  - ai
  - code-completion
  - vscode
submitted_date: '2025-11-25'
---
```

## Key Features

### ✅ Auto-Discovery

- OpenCode suggests themes based on tool analysis
- No manual theme creation required upfront
- Organic taxonomy evolution

### ✅ Auto-Activation

- New themes auto-activate on PR merge
- No separate approval workflow
- Streamlined process

### ✅ Auto-Generation

- Theme pages automatically generated
- Updated when tools are added
- Links to related themes

### ✅ Flexible Organization

- Tools can have multiple themes (1-3)
- Themes span multiple categories
- Better discovery than single-category system

## Configuration Files

### themes.json

Primary theme configuration:

```json
{
  "themes": [
    {
      "id": "ai-powered-development",
      "name": "AI-Powered Development",
      "description": "Tools leveraging AI...",
      "keywords": ["ai", "ml", "code-generation"],
      "categories": ["ai-coding-assistants", "code-analysis-quality"],
      "status": "active",
      "metadata": {
        "auto_discovered": false,
        "tool_count": 0,
        "created_date": "2025-11-24",
        "approved_by": "manual"
      }
    }
  ],
  "suggested_tags": ["ai", "cli", "vscode", ...],
  "seed_themes": ["ai-powered-development", ...]
}
```

## Scripts

### Generate Theme Pages

```bash
bun run generate:themes
```

Scans `docs/tools/` and regenerates all theme pages in `docs/themes/`.

### Analyze Themes

```bash
bun run analyze:themes
```

Discovers potential new themes by analyzing tool patterns and tags.

### Sync README

```bash
bun run sync:readme
```

Updates README.md with current categories and themes.

## Workflow Integration

### Categorize Tool Workflow

1. Loads active themes from `data/themes.json`
2. Passes themes to OpenCode in prompt
3. OpenCode responds with category + themes + tags
4. Creates tool doc with frontmatter
5. Adds new themes to `data/themes.json` if needed
6. Generates/updates theme pages
7. Creates PR

### Validate and Merge Workflow

1. Checks if PR has new themes (label: `new-themes`)
2. Validates tool documentation
3. If new themes: activates them in `data/themes.json`
4. Updates README.md
5. Merges PR
6. Closes issue

## Best Practices

### For OpenCode AI

- Assign 1-3 themes per tool (not just one)
- Choose themes based on PURPOSE, not technology
- Create new themes when existing ones don't fit
- Use descriptive theme IDs (lowercase-hyphenated)
- Provide clear, concise theme descriptions

### For Maintainers

- Review new themes in PRs before merging
- Edit theme descriptions if unclear
- Monitor theme proliferation (soft limit)
- Periodically review themes with low tool counts
- Merge similar themes if needed

### For Contributors

- Let the AI choose themes (don't override)
- Themes are assigned automatically
- Check theme pages to discover related tools
- Browse by theme in README

## Future Enhancements

Potential improvements:

1. **Theme Analytics**: Track theme popularity and growth
2. **Theme Relationships**: Define parent/child theme hierarchies
3. **Theme Search**: Full-text search across themes
4. **Theme Badges**: Visual indicators on tool pages
5. **Theme Stats**: Tool count, growth rate, activity
6. **Theme Merging**: Automated similar theme detection

## Technical Details

### Theme ID Rules

- Lowercase only
- Hyphen-separated words
- Descriptive (not acronyms)
- Unique across all themes
- Match filename pattern

Examples:

- ✅ `ai-powered-development`
- ✅ `developer-productivity`
- ✅ `code-quality-security`
- ❌ `AI-Dev` (not descriptive)
- ❌ `ai_development` (use hyphens)

### Theme Status Values

- `active`: Public theme with tools
- `pending-review`: New theme awaiting activation
- `under_review`: Theme with <3 tools (30-day grace)
- `archived`: Historical theme (no longer active)

### Tool Count Management

- Auto-incremented when tools added
- Monitored for health (minimum 3 tools)
- Triggers review process if drops below threshold
- Grace period allows recovery

## Troubleshooting

### Theme Not Appearing

Check:

1. Theme status is `active` in `data/themes.json`
2. Theme page exists in `docs/themes/`
3. Run `bun run generate:themes` to regenerate

### Theme Page Outdated

Solution:

```bash
bun run generate:themes
```

### New Theme Not Activated

Check:

1. PR was merged successfully
2. `data/themes.json` shows theme with `status: "active"`
3. Validation workflow completed

### Tool Not Listed in Theme

Check:

1. Tool frontmatter includes theme ID in `themes` array
2. Theme page regenerated after tool added
3. No typos in theme ID

## Support

For issues with the theme system:

1. Check `data/themes.json` for theme status
2. Review workflow logs in Actions tab
3. Regenerate theme pages manually
4. Create issue with `theme-system` label

---

Last updated: 2025-11-25
