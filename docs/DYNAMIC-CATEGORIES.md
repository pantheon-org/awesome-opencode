# Dynamic Categories Guide

This project now supports **dynamic category management**, making it easy to add, modify, or remove categories without changing workflow files.

## Overview

All categories are defined in a single source of truth: `data/categories.json`

### Benefits

- **Single source of truth** - All category definitions in one place
- **No workflow edits needed** - Workflows automatically load categories
- **Consistency** - README and docs always in sync
- **Easy maintenance** - Add categories in seconds

## Category Configuration

### File: `data/categories.json`

```json
{
  "categories": [
    {
      "slug": "category-slug",
      "title": "Category Title",
      "description": "Brief description of what this category includes."
    }
  ]
}
```

### Fields

- **slug**: URL-friendly identifier (lowercase, hyphens for spaces)
  - Used for directory names: `docs/{slug}/`
  - Must be unique
- **title**: Human-readable category name
  - Displayed in README headings
  - Used in PR titles
- **description**: One-line explanation
  - Helps AI categorization
  - Displayed under README headings

## How It Works

### 1. Categorization Workflow

The `categorize-tool.yml` workflow:

1. Loads categories from `data/categories.json`
2. Formats them for the OpenCode prompt
3. Passes them as options for categorization
4. Creates tool documentation in the chosen category directory

### 2. README Sync

Run `bun run sync:readme` to:

- Read categories from `data/categories.json`
- Update the README.md Categories section
- Maintain alphabetical order

### 3. Directory Management

Run `bun run ensure:categories` to:

- Create any missing category directories
- Add `.gitkeep` files to track empty directories
- Validate all categories have proper structure

## Adding a New Category

### Step 1: Update categories.json

```json
{
  "categories": [
    // ... existing categories ...
    {
      "slug": "ml-tools",
      "title": "ML & AI Tools",
      "description": "Machine learning and AI development tools."
    }
  ]
}
```

### Step 2: Create Directory Structure

```bash
bun run ensure:categories
```

Expected output:

```text
✅ Created category directory: ml-tools/
📊 Summary:
   Created: 1
   Already existed: 6
   Total categories: 7
```

### Step 3: Update README

```bash
bun run sync:readme
```

Expected output:

```text
✅ Updated existing categories section
✅ README.md synced successfully
```

### Step 4: Commit Changes

```bash
git add categories.json docs/ml-tools/ README.md
git commit -m "Add ML & AI Tools category"
```

## Modifying Categories

### Changing a Description

Edit `data/categories.json`, then run:

```bash
bun run sync:readme
git commit -am "Update category descriptions"
```

### Renaming a Category

1. Update the `title` in `data/categories.json`
2. Optionally update the `slug` (requires renaming directory)
3. Run sync scripts
4. If slug changed, manually rename the directory:

```bash
git mv docs/old-slug docs/new-slug
bun run sync:readme
```

### Removing a Category

1. Remove from `data/categories.json`
2. Run `bun run sync:readme`
3. Optionally delete the directory:

```bash
rm -rf docs/category-slug
```

## Utility Scripts

All scripts are in `src/`:

### `categories.ts`

Core utilities for category management:

- `loadCategories()` - Load categories from JSON
- `getCategoryBySlug(slug)` - Find specific category
- `ensureCategoryDirectory(slug)` - Create directory
- `formatCategoriesForPrompt()` - Format for AI prompts

### `sync-readme.ts`

Updates README.md with current categories:

```bash
bun run sync:readme
```

### `ensure-categories.ts`

Creates missing category directories:

```bash
bun run ensure:categories
```

## Integration with Workflows

### Current Workflows

All workflows automatically load categories:

1. **categorize-tool.yml** - Loads categories for AI categorization
2. **validate-and-merge.yml** - Validates category exists
3. Future workflows will also use `data/categories.json`

### How Workflows Load Categories

The categorization workflow includes these steps:

```yaml
- name: Load categories
  id: load-categories
  run: |
    CATEGORIES=$(cat categories.json | jq -c '.categories')
    echo "categories=$CATEGORIES" >> $GITHUB_OUTPUT

    CATEGORIES_PROMPT=$(cat categories.json | jq -r '.categories[] | "   - \(.slug): \(.description)"')
    echo "categories_prompt<<EOF" >> $GITHUB_OUTPUT
    echo "$CATEGORIES_PROMPT" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

- name: Use categories
  env:
    CATEGORIES_PROMPT: ${{ steps.load-categories.outputs.categories_prompt }}
  # ... use in scripts
```

## Best Practices

### Naming Categories

- **Use descriptive slugs**: `ai-coding-assistants` not `aca`
- **Keep titles concise**: 2-4 words max
- **Write clear descriptions**: Help users and AI understand scope

### Category Scope

- **Be specific but not too narrow**: Avoid creating too many categories
- **Avoid overlap**: Each tool should fit clearly in one category
- **Consider growth**: Will this category have multiple tools?

### Maintenance

- **Sync regularly**: Run `sync:readme` after any changes
- **Validate**: Use `ensure:categories` to catch issues
- **Document**: Update PROJECT.md if adding many categories

## Troubleshooting

### Category not appearing in README

```bash
# Re-sync README
bun run sync:readme

# Check categories.json is valid JSON
cat categories.json | jq '.'
```

### Directory not created

```bash
# Manually create directories
bun run ensure:categories

# Or create manually
mkdir -p docs/category-slug
touch docs/category-slug/.gitkeep
```

### Workflow not finding categories

1. Ensure `data/categories.json` is in repository root
2. Check JSON syntax is valid
3. Verify workflows have checkout step before loading categories

### Invalid category slug

Slugs must be:

- Lowercase
- Use hyphens (not underscores or spaces)
- Match directory name exactly

## Examples

### Example 1: Adding "Security Tools" Category

```bash
# 1. Edit categories.json
echo '{
  "categories": [
    ... existing ...,
    {
      "slug": "security-tools",
      "title": "Security Tools",
      "description": "Tools for security analysis, vulnerability scanning, and secure coding."
    }
  ]
}' > categories.json

# 2. Create directory and sync
bun run ensure:categories
bun run sync:readme

# 3. Commit
git add categories.json docs/security-tools/ README.md
git commit -m "Add Security Tools category"
```

### Example 2: Reorganizing Categories

```bash
# 1. Reorder categories in categories.json (order matters!)
# 2. Sync README
bun run sync:readme

# 3. Commit
git commit -am "Reorganize category order"
```

## Migration Notes

### Updating from Static Categories

If migrating from hardcoded categories:

1. All category definitions are now in `data/categories.json`
2. Workflows load categories dynamically
3. No need to edit workflow YAML files
4. Use utility scripts to manage README and directories

### Backward Compatibility

- Existing tool documentation remains in category directories
- Slug names match existing directory names
- No changes needed to existing tool files

## Future Enhancements

Potential additions:

- Category icons/emojis
- Category metadata (maintainers, tags)
- Automatic category suggestions based on tool analysis
- Category statistics and analytics
- Multi-language category names

## Support

For issues or questions:

- Check `data/categories.json` syntax with `cat categories.json | jq '.'`
- Run utility scripts to diagnose issues
- Review workflow logs in GitHub Actions
- Open an issue with the `category-management` label
