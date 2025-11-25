/**
 * Posts a categorization comment on a GitHub issue with prompt injection protection
 * @param {Object} params
 * @param {Object} params.github - GitHub API client
 * @param {Object} params.context - GitHub Actions context
 * @param {string} params.categoriesPrompt - Formatted categories string
 * @param {string} params.themesPrompt - Formatted themes string
 * @param {string} params.promptTemplate - The prompt template to use
 */

/**
 * Sanitize GitHub URL - inlined for CJS compatibility
 */
function sanitizeGitHubUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const cleaned = url.trim().split(/\s+/)[0];
  const githubUrlPattern =
    /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.\/-]*)?(?:\?[a-zA-Z0-9=&_-]*)?(?:#[a-zA-Z0-9_-]*)?$/;
  if (!githubUrlPattern.test(cleaned)) return null;
  if (/%[0-9A-Fa-f]{2}/.test(cleaned)) {
    try {
      const decoded = decodeURIComponent(cleaned);
      if (decoded !== cleaned && !githubUrlPattern.test(decoded)) return null;
    } catch {
      return null;
    }
  }
  return cleaned;
}

/**
 * Sanitize repository name
 */
function sanitizeRepoName(repoName) {
  if (!repoName || typeof repoName !== 'string') return null;
  const cleaned = repoName.trim();
  const repoNamePattern = /^[a-zA-Z0-9._-]{1,100}$/;
  if (!repoNamePattern.test(cleaned)) return null;
  if (cleaned.includes('..') || cleaned.startsWith('.') || cleaned.startsWith('-')) return null;
  const suspiciousWords = [
    'ignore',
    'system',
    'prompt',
    'instruction',
    'override',
    'bypass',
    'admin',
  ];
  const lowerName = cleaned.toLowerCase();
  if (suspiciousWords.some((word) => lowerName.includes(word))) return null;
  return cleaned;
}

/**
 * Detect potential injection attempts
 */
function detectInjection(text) {
  if (!text || typeof text !== 'string') return false;
  const dangerousPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|commands?|prompts?)/i,
    /you\s+are\s+now\s+(?:a|an)/i,
    /your\s+new\s+(?:task|instruction|role)/i,
    /system\s+update\s*:/i,
  ];
  return dangerousPatterns.some((pattern) => pattern.test(text));
}

module.exports = async ({ github, context, categoriesPrompt, themesPrompt, promptTemplate }) => {
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
  const repoUrl = sanitizeGitHubUrl(rawUrl);

  if (!repoUrl) {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: `❌ **Error**: Invalid GitHub repository URL detected. Please provide a valid GitHub URL.`,
    });
    return;
  }

  // Extract and sanitize repo name
  const repoPath = repoUrl.replace('https://github.com/', '');
  const rawRepoName = repoPath.split('/').pop();
  const repoName = sanitizeRepoName(rawRepoName);

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
  if (detectInjection(body)) {
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
};
