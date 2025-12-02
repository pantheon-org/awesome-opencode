/**
 * Posts a categorization comment on a GitHub issue with prompt injection protection
 *
 * Imports security functions from the shared security module to validate
 * user input and prevent prompt injection attacks.
 *
 * @param github - GitHub API client
 * @param context - GitHub Actions context
 * @param categoriesPrompt - Formatted categories string
 * @param themesPrompt - Formatted themes string
 * @param promptTemplate - The prompt template to use
 */

import { isValidGitHubUrl, sanitizeRepoName, detectInjectionAttempt } from '../../src/security';

interface PostCategorizationCommentParams {
  github: any;
  context: any;
  categoriesPrompt: string;
  themesPrompt: string;
  promptTemplate: string;
}

export async function postCategorizationComment({
  github,
  context,
  categoriesPrompt,
  themesPrompt,
  promptTemplate,
}: PostCategorizationCommentParams): Promise<void> {
  const body = context.payload.issue.body;
  const urlMatch = body.match(/https:\/\/github\.com\/[^\s\)]+/);

  if (!urlMatch) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `❌ **Error**: No GitHub repository URL found. Cannot proceed with categorization.`,
    });
    return;
  }

  const rawUrl = urlMatch[0];

  // Validate the URL using shared security module
  if (!isValidGitHubUrl(rawUrl)) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `❌ **Error**: Invalid GitHub repository URL detected. Please provide a valid GitHub URL.`,
    });
    return;
  }

  const repoUrl = rawUrl;

  // Extract and sanitize repo name
  const repoPath = repoUrl.replace('https://github.com/', '');
  const rawRepoName = repoPath.split('/').pop();
  const repoName = sanitizeRepoName(rawRepoName || '');

  if (!repoName) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `❌ **Error**: Invalid repository name detected in URL.`,
    });
    return;
  }

  // Detect injection attempts
  if (detectInjectionAttempt(body)) {
    console.log('[Security] Potential prompt injection attempt detected in issue body');
  }

  const currentDate = new Date().toISOString().split('T')[0];

  // Load and populate the prompt template with XML-wrapped user content
  const commentBody = promptTemplate
    .replace(/\{\{REPO_URL\}\}/g, `<user_input label="Repository URL">${repoUrl}</user_input>`)
    .replace(
      /\{\{CATEGORIES_PROMPT\}\}/g,
      `<data label="Categories">\n${categoriesPrompt}\n</data>`,
    )
    .replace(/\{\{THEMES_PROMPT\}\}/g, `<data label="Themes">\n${themesPrompt}\n</data>`)
    .replace(/\{\{ISSUE_NUMBER\}\}/g, context.issue.number)
    .replace(/\{\{REPO_NAME\}\}/g, repoName)
    .replace(/\{\{CURRENT_DATE\}\}/g, currentDate);

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: commentBody,
  });
}

// Export default for direct module execution
export default postCategorizationComment;
