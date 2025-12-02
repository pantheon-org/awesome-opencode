/**
 * Posts a triage comment on a GitHub issue with prompt injection protection
 *
 * Imports security functions from the shared security module to validate
 * user input and prevent prompt injection attacks.
 *
 * @param github - GitHub API client
 * @param context - GitHub Actions context
 * @param core - GitHub Actions core utilities
 * @param promptTemplate - The prompt template to use
 */

import { isValidGitHubUrl, detectInjectionAttempt } from '../../src/security';

interface PostTriageCommentParams {
  github: any;
  context: any;
  core: any;
  promptTemplate: string;
}

export async function postTriageComment({
  github,
  context,
  core,
  promptTemplate,
}: PostTriageCommentParams): Promise<void> {
  const body = context.payload.issue.body;
  const urlMatch = body.match(/https:\/\/github\.com\/[^\s\)]+/);

  if (!urlMatch) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `❌ **Error**: No GitHub repository URL found in the issue body. Please edit the issue and include a valid GitHub URL.`,
    });
    core.setFailed('No GitHub repository URL found in issue body');
    return;
  }

  const rawUrl = urlMatch[0];

  // Validate the URL using shared security module
  if (!isValidGitHubUrl(rawUrl)) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `❌ **Error**: Invalid GitHub repository URL detected. Please edit the issue with a valid GitHub URL (e.g., https://github.com/owner/repo).`,
    });
    core.setFailed('Invalid GitHub repository URL');
    return;
  }

  const repoUrl = rawUrl;

  // Detect injection attempts for logging
  if (detectInjectionAttempt(body)) {
    core.warning('Potential prompt injection attempt detected in issue body');
  }

  // Load and populate the prompt template with XML-wrapped content
  const commentBody = promptTemplate.replace(
    /\{\{REPO_URL\}\}/g,
    `<user_input label="Repository URL">${repoUrl}</user_input>`,
  );

  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.issue.number,
    body: commentBody,
  });
}

// Export default for direct module execution
export default postTriageComment;
