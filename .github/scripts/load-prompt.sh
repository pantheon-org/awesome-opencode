#!/bin/bash
set -e

# Load prompt template and output to GitHub Actions
PROMPT=$(cat .github/prompts/triage-relevance.md)
echo "prompt<<EOF" >> "$GITHUB_OUTPUT"
echo "$PROMPT" >> "$GITHUB_OUTPUT"
echo "EOF" >> "$GITHUB_OUTPUT"
