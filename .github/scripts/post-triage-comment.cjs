/**
 * Posts a triage comment on a GitHub issue with prompt injection protection
 * @param {Object} params
 * @param {Object} params.github - GitHub API client
 * @param {Object} params.context - GitHub Actions context
 * @param {Object} params.core - GitHub Actions core utilities
 * @param {string} params.promptTemplate - The prompt template to use
 */

// Import security utilities (note: this will require the TypeScript build step)
// For now, we'll inline simple security checks since this is a CJS file

/**
 * Sanitize GitHub URL - inlined for CJS compatibility
 * @param {string} url - Raw URL string
 * @returns {string|null} - Sanitized URL or null if invalid
 */
function sanitizeGitHubUrl(url) {
  if (!url || typeof url !== 'string') return null;

  // Remove whitespace and newlines, take first token only
  const cleaned = url.trim().split(/\s+/)[0];

  // Strict GitHub URL validation
  const githubUrlPattern =
    /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.\/-]*)?(?:\?[a-zA-Z0-9=&_-]*)?(?:#[a-zA-Z0-9_-]*)?$/;

  if (!githubUrlPattern.test(cleaned)) return null;

  // Check for URL encoding attempts
  if (/%[0-9A-Fa-f]{2}/.test(cleaned)) {
    try {
      const decoded = decodeURIComponent(cleaned);
      if (decoded !== cleaned && !githubUrlPattern.test(decoded)) {
        return null;
      }
    } catch {
      return null;
    }
  }

  return cleaned;
}

/**
 * Detect potential injection attempts for logging
 * @param {string} text - Text to check
 * @returns {boolean} - True if injection detected
 */
function detectInjection(text) {
  if (!text || typeof text !== 'string') return false;

  const dangerousPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|commands?|prompts?)/i,
    /you\s+are\s+now\s+(?:a|an)/i,
    /your\s+new\s+(?:task|instruction|role)/i,
    /system\s+update\s*:/i,
    /---+\s*(?:end|close)\s*(?:system|prompt)/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(text));
}

module.exports = async ({ github, context, core, promptTemplate }) => {
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

  // Sanitize the URL
  const repoUrl = sanitizeGitHubUrl(rawUrl);

  if (!repoUrl) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `❌ **Error**: Invalid GitHub repository URL detected. Please edit the issue with a valid GitHub URL (e.g., https://github.com/owner/repo).`,
    });
    core.setFailed('Invalid GitHub repository URL');
    return;
  }

  // Detect injection attempts for logging
  if (detectInjection(body)) {
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
};
