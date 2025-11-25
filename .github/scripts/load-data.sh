#!/bin/bash
set -e

# Load categories and format for prompt
CATEGORIES=$(cat categories.json | jq -c '.categories')
echo "categories=$CATEGORIES" >> "$GITHUB_OUTPUT"

# Format categories for prompt
CATEGORIES_PROMPT=$(cat categories.json | jq -r '.categories[] | "   - \(.slug): \(.description)"')
echo "categories_prompt<<EOF" >> "$GITHUB_OUTPUT"
echo "$CATEGORIES_PROMPT" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"

# Format themes for prompt
THEMES_PROMPT=$(cat themes.json | jq -r '.themes[] | select(.status == "active") | "   - \(.id): \(.description)\n     Keywords: \(.keywords | join(", "))"')
echo "themes_prompt<<EOF" >> "$GITHUB_OUTPUT"
echo "$THEMES_PROMPT" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"

# Load prompt template
PROMPT_TEMPLATE=$(cat .github/prompts/categorize-tool.md)
echo "prompt_template<<EOF" >> "$GITHUB_OUTPUT"
echo "$PROMPT_TEMPLATE" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"
